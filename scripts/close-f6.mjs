import { execFile } from 'node:child_process';
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';

const TESTS = [
  ['test:metrics', 'metrics tests'],
  ['smoke:metrics', 'metrics smoke'],
];

function run(cmd, args = []) {
  return new Promise(resolve => {
    execFile(cmd, args, { encoding: 'utf8' }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err?.code ?? 0, stdout, stderr });
    });
  });
}

function toggleCheckbox(markdown, label, done) {
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*- \[( |x)\]\s*/.test(line)) {
      const text = line.replace(/^\s*- \[( |x)\]\s*/, '');
      if (text.trim() === label.trim()) {
        lines[i] = line.replace(/^(\s*- \[)( |x)(\]\s*)/, `$1${done ? 'x' : ' '}$3`);
      }
    }
  }
  return lines.join('\n');
}

function upsertEvidence(markdown, entry) {
  if (!/## Evidencias/i.test(markdown)) markdown += '\n\n## Evidencias\n';
  return markdown.replace(/(## Evidencias[^\n]*\n)/i, `$1- ${entry}\n`);
}

function updateContext(ctx, results) {
  const stamp = `Actualizado: ${new Date().toISOString()}`;
  const block = `\n**Integración F6** — ${stamp}\n${results.map(r => `- ${r}`).join('\n')}\n`;
  const marker = /(## Estado actual[^\n]*\n)/i;
  if (marker.test(ctx)) {
    return ctx.replace(marker, match => match + block);
  }
  return ctx + `\n\n## Estado actual\n${block}`;
}

async function main() {
  const ts = new Date().toISOString();
  const results = [];

  for (const [script, label] of TESTS) {
    // eslint-disable-next-line no-await-in-loop
    const out = await run('pnpm', [script]);
    results.push(`${label} → ${out.ok ? 'PASS' : 'FAIL'}`);
  }

  const allPass = results.every(line => line.endsWith('PASS'));

  let task = await readFile('task.md', 'utf8');
  task = upsertEvidence(task, `${ts} — ${results.join('; ')}`);
  if (allPass) {
    task = toggleCheckbox(task, 'A9 — /metrics estable (Prom format) + counters/histos en activate/execute', true);
    task = toggleCheckbox(task, 'A9.1 — smoke-metrics PASS + evidencia', true);
    task = toggleCheckbox(task, 'A9.2 — test:metrics PASS', true);
  }
  await writeFile('task.md', task, 'utf8');

  let ctx = await readFile('context.md', 'utf8');
  ctx = updateContext(ctx, results);
  await writeFile('context.md', ctx, 'utf8');

  await mkdir('obs/kpi', { recursive: true });
  await appendFile(
    'obs/kpi/events.jsonl',
    JSON.stringify({ ts, kind: 'f6:close', results, allPass }) + '\n'
  );

  console.log(JSON.stringify({ ts, results, allPass }, null, 2));
  process.exitCode = allPass ? 0 : 2;
}

main().catch(error => {
  console.error(error);
  process.exit(2);
});
