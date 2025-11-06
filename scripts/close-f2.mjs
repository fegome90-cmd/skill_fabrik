import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

function run(cmd, args = []) {
  return new Promise((res) => {
    execFile(cmd, args, { encoding: 'utf8' }, (err, stdout, stderr) => {
      res({ ok: !err, code: err?.code ?? 0, stdout, stderr });
    });
  });
}

function toggleCheckboxByLabel(md, label, done) {
  const lines = md.split('\n');
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
  return md;
}

function toggleCheckboxByPrefix(md, prefix, done) {
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*- \[( |x)\]\s*/.test(line)) {
      const text = line.replace(/^\s*- \[( |x)\]\s*/, '');
      if (text.trim().startsWith(prefix)) {
        lines[i] = line.replace(/^(\s*- \[)( |x)(\]\s*)/, `$1${done ? 'x' : ' '}$3`);
        return lines.join('\n');
      }
    }
  }
  return md;
}

function upsertEvidence(md, line) {
  if (!/## Evidencias/i.test(md)) md += `\n\n## Evidencias\n`;
  return md.replace(/(## Evidencias[^\n]*\n)/i, `$1- ${line}\n`);
}

function updateContext(ctx, lines) {
  const stamp = `Actualizado: ${new Date().toISOString()}`;
  const block = `\n**Integración F2** — ${stamp}\n${lines.map((l) => `- ${l}`).join('\n')}\n`;
  const markerRe = /(## Estado actual.*\n)/i;
  if (markerRe.test(ctx)) return ctx.replace(markerRe, (m) => m + block);
  return ctx + `\n\n## Estado actual\n` + block;
}

async function main() {
  // 1) Correr pruebas y snapshot
  const deny = await run('pnpm', ['test:policy:deny']);
  const allow = await run('pnpm', ['test:policy:allow']);
  const snapX = await run('pnpm', ['snapshot:execute']);
  const snapXTest = await run('pnpm', ['test:snapshot:execute']);

  const pass = {
    deny: deny.ok,
    allow: allow.ok,
    snapshotExecute: snapX.ok && snapXTest.ok,
  };

  const ts = new Date().toISOString();
  const lines = [
    `Policy deny → ${pass.deny ? 'PASS' : 'FAIL'}`,
    `Policy allow (read-only) → ${pass.allow ? 'PASS' : 'FAIL'}`,
    `Snapshot /execute (dry-run) → ${pass.snapshotExecute ? 'PASS' : 'FAIL'}`,
  ];

  // 2) Actualizar task.md (sólo si TODO PASS)
  let task = await readFile('task.md', 'utf8');
  task = upsertEvidence(task, `${ts} — ${lines.join('; ')}`);

  const allPass = pass.deny && pass.allow && pass.snapshotExecute;
  if (allPass) {
    task = toggleCheckboxByLabel(task, 'A3 — Policy mínimo + Runner read-only', true);
    // Subtareas por prefijo (si existen como checkboxes)
    ['A3.1', 'A3.2', 'A3.3', 'A3.4', 'A3.5'].forEach((code) => {
      task = toggleCheckboxByPrefix(task, code, true);
    });
  }
  await writeFile('task.md', task, 'utf8');

  // 3) Actualizar context.md
  let ctx = await readFile('context.md', 'utf8');
  ctx = updateContext(ctx, lines);
  await writeFile('context.md', ctx, 'utf8');

  console.log(JSON.stringify({ ts, ...pass, allPass }, null, 2));
  process.exitCode = allPass ? 0 : 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

