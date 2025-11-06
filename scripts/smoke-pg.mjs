import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const client = new Client({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  });
  await client.connect();
  await client.query('SELECT 1');
  await client.query(
    'INSERT INTO sf_events (editor, repo, skill, activation_latency_ms, labels, extra) VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
    ['pg-smoke', '', 'smoke', 0, ['smoke'], JSON.stringify({ smoke: true })]
  );
  await client.end();
  console.log('PG smoke PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

