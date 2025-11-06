const URL = process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';
const N = Number(process.env.N || 100);

async function main() {
  const lat = [];
  for (let i = 0; i < N; i++) {
    const t0 = Date.now();
    const r = await fetch(`${URL}/activate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intent: 'lint rápido', cwd: '.', editor: 'cli' })
    });
    await r.json();
    lat.push(Date.now() - t0);
  }

  lat.sort((a, b) => a - b);
  const idx = (p) => Math.floor(p * (lat.length - 1));
  const p50 = lat[idx(0.5)];
  const p95 = lat[idx(0.95)];
  console.log(JSON.stringify({ n: N, p50, p95 }, null, 2));
  if (p95 >= 50) process.exitCode = 2;
}

main().catch((e) => { console.error(e); process.exit(1); });

