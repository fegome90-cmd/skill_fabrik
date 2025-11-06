import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

function run(cmd, args = []) {
  return new Promise((res) => {
    execFile(cmd, args, { encoding: 'utf8' }, (err, stdout, stderr) => {
      res({ ok: !err, code: err?.code ?? 0, stdout, stderr });
    });
  });
}

function toggleCheckboxById(md, id, done) {
  // Match a markdown task list item containing the id text
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*- \[( |x)\]\s*/.test(line) && line.includes(id)) {
      lines[i] = line.replace(/^(\s*- \[)( |x)(\]\s*)/, `$1${done ? 'x' : ' '}$3`);
      return lines.join('\n');
    }
  }
  return md;
}

function addEvidence(md, line) {
  const headerRe = /(^|\n)## Evidencias(.*)\n/;
  if (headerRe.test(md)) {
    return md.replace(headerRe, (m) => m + `- ${line}\n`);
  }
  return md.trimEnd() + `\n\n## Evidencias\n- ${line}\n`;
}

function updateContextState(ctx, benchLine, parityLine) {
  const stamp = `Actualizado: ${new Date().toISOString()}`;
  const block = `\n**Integración F1** — ${stamp}\n- ${benchLine}\n- ${parityLine}\n`;
  const markerRe = /(## Estado actual.*\n)/i;
  if (markerRe.test(ctx)) {
    return ctx.replace(markerRe, (m) => m + block);
  }
  return ctx + `\n\n## Estado actual\n` + block;
}

async function main() {
  const ts = new Date().toISOString();

  // 1) Bench
  const b = await run('pnpm', ['bench:activate']);
  let p95 = null, p50 = null, benchPass = false;
  try {
    const j = JSON.parse((b.stdout || '').trim());
    p95 = j.p95; p50 = j.p50;
    benchPass = typeof p95 === 'number' && p95 < 50;
  } catch {
    benchPass = false;
  }

  // 2) Paridad
  const t = await run('pnpm', ['test:parity']);
  const parityPass = t.ok;

  // 3) task.md updates
  let task = await readFile('task.md', 'utf8');
  if (benchPass) task = toggleCheckboxById(task, 'P1 — Bench `/activate` p95 < 50 ms', true);
  if (parityPass) task = toggleCheckboxById(task, 'P2 — Test de paridad CLI↔HTTP', true);

  const benchLine = `Bench /activate → p50=${p50 ?? 'NA'} ms, p95=${p95 ?? 'NA'} ms (${benchPass ? 'PASS' : 'FAIL'})`;
  const parityLine = `Paridad CLI↔HTTP → ${parityPass ? 'PASS' : 'FAIL'}`;
  task = addEvidence(task, `${ts} — ${benchLine}; ${parityLine}`);
  await writeFile('task.md', task, 'utf8');

  // 4) context.md updates
  let ctx = await readFile('context.md', 'utf8');
  ctx = updateContextState(ctx, benchLine, parityLine);
  await writeFile('context.md', ctx, 'utf8');

  // 5) Output summary
  console.log(JSON.stringify({ ts, p50, p95, benchPass, parityPass }, null, 2));
  process.exitCode = benchPass && parityPass ? 0 : 2;

  // 6) Append pipeline summary event to JSONL
  try {
    const { mkdir, appendFile } = await import('node:fs/promises');
    const { resolve, join } = await import('node:path');
    const dir = resolve(process.cwd(), 'obs/kpi');
    await mkdir(dir, { recursive: true });
    const evt = { ts, kind: 'triada:update', p50, p95, benchPass, parityPass };
    await appendFile(join(dir, 'events.jsonl'), JSON.stringify(evt) + '\n', 'utf8');
  } catch {}
}

main().catch((e) => { console.error(e); process.exit(2); });
