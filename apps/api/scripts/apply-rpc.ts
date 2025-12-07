import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });

async function run() {
  // Fix for dotenv not expanding variables
  let connectionString = process.env.DATABASE_URL;
  if (
    connectionString &&
    connectionString.includes('${SUPABASE_DB_PASSWORD}')
  ) {
    const password = process.env.SUPABASE_DB_PASSWORD;
    if (!password) {
      console.error('SUPABASE_DB_PASSWORD is missing');
      process.exit(1);
    }
    connectionString = connectionString.replace(
      '${SUPABASE_DB_PASSWORD}',
      password
    );
  } else if (!connectionString) {
    console.error('DATABASE_URL is missing. Checked path:', rootEnvPath);
    process.exit(1);
  }

  // Supabase transaction pooler often requires explicit SSL mode
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // Fix path resolution: simplified approach using relative path from CWD if possible,
    // or robustly traversing up.
    // __dirname in tsx/ESM can be tricky.
    // Let's assume we run this from 'apps/api'.
    // The migration is in '../../infra/supabase/migrations/...'

    // Check if we are in apps/api
    const cwd = process.cwd();
    let migrationFile = '';

    if (cwd.endsWith('apps/api')) {
      migrationFile = path.resolve(
        cwd,
        '../../infra/supabase/migrations/20251207200000_create_plan_rpc.sql'
      );
    } else {
      // Fallback or assume root?
      migrationFile = path.resolve(
        __dirname,
        '../../../../infra/supabase/migrations/20251207200000_create_plan_rpc.sql'
      );
    }

    if (!fs.existsSync(migrationFile)) {
      console.error('Migration file not found at:', migrationFile);
      // Try one more common path (monorepo root)
      const rootPath = path.resolve(
        cwd,
        'infra/supabase/migrations/20251207200000_create_plan_rpc.sql'
      );
      if (fs.existsSync(rootPath)) {
        migrationFile = rootPath;
      } else {
        process.exit(1);
      }
    }

    const migrationPath = migrationFile;

    console.log(`Reading migration: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing SQL...');
    await client.query(sql);

    console.log('Reloading PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema'");

    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
