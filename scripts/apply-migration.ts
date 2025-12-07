import { Client } from 'pg';
import { loadConfig } from '@runflow/config';
import fs from 'fs';
import path from 'path';

async function main() {
  // config loaded via loadConfig side-effect of loading .env
  loadConfig();

  // Need to construct connection string or use one from env
  // config.supabase.url is HTTPS URL.
  // I need the Postgres connection string.
  // It is in .env as DATABASE_URL.
  // loadConfig doesn't expose DATABASE_URL directly in the config object if it's not mapped.
  // But I can read process.env.DATABASE_URL if I load .env

  // loadConfig loads .env into process.env if not CI.
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('DATABASE_URL not found in env');
    process.exit(1);
  }

  // Attempt to construct direct URL from pooler URL if possible, or assume format.
  // env has: postgres://postgres.lojjhatxyaxxbxiqbuwp:PASSWORD@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
  // Direct: postgres://postgres:PASSWORD@db.lojjhatxyaxxbxiqbuwp.supabase.co:5432/postgres

  let connectionString = dbUrl;

  // Quick hack to force direct connection if using pooler
  if (dbUrl.includes('pooler.supabase.com')) {
    // Extract password and project ref?
    // format: postgres://USER:PASSWORD@HOST:PORT/DB
    const match = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@/);
    if (match) {
      const password = match[2];
      // The username in pooler url often contains project ref: postgres.REF
      const userPart = match[1];
      const projectRef = userPart.split('.')[1];

      if (projectRef) {
        connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
        console.log(
          'Using direct connection:',
          connectionString.replace(password, '****')
        );
      }
    }
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many cases
  });

  await client.connect();

  const migrationPath = path.join(
    __dirname,
    '../packages/db/migrations/20250101000000_update_training_plan_status.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...');
  console.log(sql);

  try {
    await client.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
