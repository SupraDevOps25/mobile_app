/**
 * Refresh the LOCAL dev database from PRODUCTION (Neon).
 *
 *   npm run db:pull-prod
 *
 * Dumps prod via a throwaway postgres:17 container (using PROD_DIRECT_URL — the
 * non-pooled endpoint, required for pg_dump) and restores it into the local
 * Docker Postgres (container `supracarer-db`, see docker-compose.yml). The
 * local `public` schema is dropped first, so this is safe to run repeatedly.
 *
 * Prerequisites: Docker Desktop running + `docker compose up -d`.
 * Reads only PROD_DIRECT_URL; never touches production (dump is read-only).
 */
import 'dotenv/config';
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROD_URL = process.env.PROD_DIRECT_URL;
const CONTAINER = 'supracarer-db';
const PG_IMAGE = 'postgres:17';
const DUMP_PATH = resolve(process.cwd(), '..', 'neon-dump.sql'); // repo root

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function ensureLocalRunning(): void {
  const res = spawnSync('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER], {
    encoding: 'utf8',
  });
  if (res.status !== 0 || res.stdout.trim() !== 'true') {
    fail(
      `Local DB container "${CONTAINER}" is not running.\n` +
        '  Start Docker Desktop, then: docker compose up -d',
    );
  }
}

function main(): void {
  if (!PROD_URL) fail('Set PROD_DIRECT_URL in api/.env (the Neon direct endpoint).');
  ensureLocalRunning();

  console.log('→ Dumping production (Neon) …');
  const dump = execFileSync(
    'docker',
    ['run', '--rm', PG_IMAGE, 'pg_dump', PROD_URL, '--no-owner', '--no-privileges'],
    { maxBuffer: 512 * 1024 * 1024 },
  );
  writeFileSync(DUMP_PATH, dump);
  console.log(`  saved ${DUMP_PATH} (${(dump.length / 1024).toFixed(0)} KB)`);

  console.log('→ Resetting local schema …');
  execFileSync(
    'docker',
    [
      'exec', '-i', CONTAINER,
      'psql', '-U', 'supracarer', '-d', 'supracarer', '-v', 'ON_ERROR_STOP=1',
      '-c',
      'SET client_min_messages=warning; DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );

  console.log('→ Restoring into local …');
  const restore = spawnSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', 'supracarer', '-d', 'supracarer', '-v', 'ON_ERROR_STOP=1', '-q'],
    { input: dump, stdio: ['pipe', 'ignore', 'inherit'] },
  );
  if (restore.status !== 0) fail('Restore failed — see psql errors above.');

  console.log('\n✔ Local DB refreshed from production.\n');
}

main();
