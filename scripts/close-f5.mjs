import { execFile } from 'node:child_process';
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';

function run(cmd, args = []) {
  return new Promise(resolve => {
    execFile(cmd, args, { encoding: 'utf8' }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err?.code ?? 0, stdout, stderr });
    });
  });
}

function toggleCheckboxByLabel(markdown, label, done) {
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*- \[( |x)\]\s*/.test(line)) {
      const text = line.replace(/^\s*- \[( |x)\]\s*/, '');
      if (text.trim() === label.trim()) {
        lines[i] = line.replace(/^(\s*- \[)( |x)(\]\s*)/, `$1${done ? 'x' : ' '}$3`);
        return lines.join('\n');
      }
    }
  }
  return markdown;
}

function upsertEvidence(markdown, line) {
  if (!/## Evidencias/i.test(markdown)) markdown += `\n\n## Evidencias\n`;
  return markdown.replace(/(## Evidencias[^\n]*\n)/i, `$1- ${line}\n`);
}

function addIntegrationBlock(ctx, lines) {
  const stamp = `Actualizado: ${new Date().toISOString()}`;
  const block = `\n**Integración F5** — ${stamp}\n${lines.map(l => `- ${l}`).join('\n')}\n`;
  const marker = /(## Estado actual[^\n]*\n)/i;
  if (marker.test(ctx)) {
    return ctx.replace(marker, match => match + block);
  }
  return ctx + `\n\n## Estado actual\n` + block;
}

async function main() {
  const ts = new Date().toISOString();
  const tests = [
    ['test:confirm:s1:challenge', 'S1 challenge'],
    ['test:confirm:s1:badtoken', 'S1 bad token'],
    ['test:confirm:s1:ok', 'S1 confirm OK'],
    ['test:confirm:inline', 'Inline confirm'],
  ];

  const results = [];
  for (const [script, label] of tests) {
    // eslint-disable-next-line no-await-in-loop
    const outcome = await run('pnpm', [script]);
    results.push(`${label} → ${outcome.ok ? 'PASS' : 'FAIL'}`);
  }

  const allPass = results.every(line => /PASS$/.test(line));

  let task = await readFile('task.md', 'utf8');
  task = upsertEvidence(task, `${ts} — ${results.join('; ')}`);
  if (allPass) {
    task = toggleCheckboxByLabel(task, 'A8 — Confirm flow S1 (challenge + token + TTL)', true);
  }
  await writeFile('task.md', task, 'utf8');

  let ctx = await readFile('context.md', 'utf8');
  ctx = addIntegrationBlock(ctx, results);
  await writeFile('context.md', ctx, 'utf8');

  await mkdir('obs/kpi', { recursive: true });
  await appendFile(
    'obs/kpi/events.jsonl',
    JSON.stringify({ ts, kind: 'f5:close', results, allPass }) + '\n'
  );

  console.log(JSON.stringify({ ts, results, allPass }, null, 2));
  process.exitCode = allPass ? 0 : 2;
}

main().catch(error => {
  console.error(error);
  process.exit(2);
});
