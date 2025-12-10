import { Job } from 'bullmq';
import { createServiceClient, Database } from '@runflow/db';
import { config } from '../config';

const supabase = createServiceClient({
  supabaseUrl: config.supabase.url,
  supabaseAnonKey: config.supabase.anonKey,
  supabaseServiceRoleKey: config.supabase.serviceRoleKey
});

interface SyncStravaJobData {
  userId: string;
  fullSync?: boolean;
}

interface StravaActivity {
  id: number;
  type: string;
  start_date: string;
  elapsed_time: number;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
}

export async function syncStravaProcessor(job: Job<SyncStravaJobData>) {
  const { userId, fullSync } = job.data;
  job.log(`Starting Strava sync for user ${userId} (Full: ${fullSync})`);

  // 1. Get Integration
  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .single();

  if (error || !data) {
    throw new Error('Strava integration not found');
  }

  const integration = data;
  const stravaConfig = config.strava;

  let accessToken = integration.access_token;

  // 2. Refresh Token if needed
  if (Date.now() / 1000 > integration.expires_at - 300) {
    // 5 min buffer
    job.log('Refreshing token...');
    try {
      const refreshRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: stravaConfig.clientId,
          client_secret: stravaConfig.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token
        })
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok) throw new Error('Token refresh failed');

      // Update DB
      await supabase
        .from('user_integrations')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: refreshData.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);

      accessToken = refreshData.access_token;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      throw new Error(`Auth refresh failed: ${msg}`);
    }
  }

  // 3. Fetch Activities
  const after = fullSync ? 0 : integration.sync_cursor || 0;
  const activitiesUrl = `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`;

  const actsRes = await fetch(activitiesUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!actsRes.ok) throw new Error('Failed to fetch activities');
  const activities: StravaActivity[] = await actsRes.json();

  if (!Array.isArray(activities) || activities.length === 0) {
    job.log('No new activities found');
    return { synced: 0 };
  }

  // 4. Insert into sessions
  let syncedCount = 0;
  for (const act of activities) {
    if (act.type !== 'Run') continue; // Only sync runs for now

    const sessionData: Database['public']['Tables']['sessions']['Insert'] = {
      user_id: userId,
      start_time: act.start_date,
      end_time: new Date(
        new Date(act.start_date).getTime() + act.elapsed_time * 1000
      ).toISOString(),
      status: 'completed',
      metrics: {
        distance: act.distance,
        duration: act.moving_time,
        elevation: act.total_elevation_gain,
        strava_id: act.id
      }
    };

    const { error: insertError } = await supabase
      .from('sessions')
      .upsert(sessionData, { onConflict: 'user_id, start_time' }); // Weak de-dupe key, ideally use external_id if added

    if (!insertError) syncedCount++;
  }

  // 5. Update Cursor
  if (activities.length > 0) {
    // Docs say 'after' filters. Usually returns list. We should find max start_date timestamp.
    // Actually typical paging is by page. Let's strictly use the max timestamp we saw.
    const maxTime = Math.max(
      ...activities.map((a) => new Date(a.start_date).getTime() / 1000)
    );

    await supabase
      .from('user_integrations')
      .update({ sync_cursor: Math.ceil(maxTime) })
      .eq('id', integration.id);
  }

  job.log(`Sync completed. Imported ${syncedCount} sessions.`);
  return { synced: syncedCount };
}
