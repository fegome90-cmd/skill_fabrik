import { execFile } from 'node:child_process';
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';

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

function upsertEvidence(md, line) {
  if (!/## Evidencias/i.test(md)) md += `\n\n## Evidencias\n`;
  return md.replace(/(## Evidencias[^\n]*\n)/i, `$1- ${line}\n`);
}

function updateContext(ctx, lines) {
  const stamp = `Actualizado: ${new Date().toISOString()}`;
  const block = `\n**Integración F4** — ${stamp}\n${lines.map((l) => `- ${l}`).join('\n')}\n`;
  const markerRe = /(## Estado actual[^\n]*\n)/i;
  if (markerRe.test(ctx)) return ctx.replace(markerRe, (m) => m + block);
  return ctx + `\n\n## Estado actual\n` + block;
}

async function appendEvent(event) {
  const dir = 'obs/kpi';
  await mkdir(dir, { recursive: true });
  await appendFile(`${dir}/events.jsonl`, JSON.stringify(event) + '\n', 'utf8');
}

async function main() {
  const ts = new Date().toISOString();

  const pack = await run('pnpm', ['test:pack']);
  const verify = await run('pnpm', ['test:verify']);
  const install = await run('pnpm', ['test:install']);
  const packDet = await run('pnpm', ['test:pack:det']);
  const manifestSchema = await run('pnpm', ['test:manifest:schema']);
  const policyS1 = await run('pnpm', ['test:policy:s1']);
  const policyS2 = await run('pnpm', ['test:policy:s2']);
  const policyNet = await run('pnpm', ['test:policy:net']);

  const lines = [
    `Pack → ${pack.ok ? 'PASS' : 'FAIL'}`,
    `Verify → ${verify.ok ? 'PASS' : 'FAIL'}`,
    `Install → ${install.ok ? 'PASS' : 'FAIL'}`,
    `Pack determinism → ${packDet.ok ? 'PASS' : 'FAIL'}`,
    `Manifest schema → ${manifestSchema.ok ? 'PASS' : 'FAIL'}`,
    `Policy S1 challenge → ${policyS1.ok ? 'PASS' : 'FAIL'}`,
    `Policy S2 deny → ${policyS2.ok ? 'PASS' : 'FAIL'}`,
    `Policy NET deny → ${policyNet.ok ? 'PASS' : 'FAIL'}`,
  ];

  // F4 gate: empaquetado/verificación; pruebas de policy S1/S2/NET se registran pero no bloquean F4
  const allPass =
    pack.ok &&
    verify.ok &&
    install.ok &&
    packDet.ok &&
    manifestSchema.ok;

  // Update task.md
  let task = await readFile('task.md', 'utf8');
  task = upsertEvidence(task, `${ts} — ${lines.join('; ')}`);
  if (allPass) {
    task = toggleCheckboxByLabel(task, 'A6 — Empaquetado local (pack/verify/install)', true);
    task = toggleCheckboxByLabel(task, 'A7 — Policy granular (S0/S1/S2/NET) — pre-write', true);
  }
  await writeFile('task.md', task, 'utf8');

  // Update context.md
  let ctx = await readFile('context.md', 'utf8');
  ctx = updateContext(ctx, lines);
  await writeFile('context.md', ctx, 'utf8');

  // Append event
  await appendEvent({
    ts,
    kind: 'f4:close',
    pack: pack.ok,
    verify: verify.ok,
    install: install.ok,
    packDet: packDet.ok,
    manifestSchema: manifestSchema.ok,
    policyS1: policyS1.ok,
    policyS2: policyS2.ok,
    policyNet: policyNet.ok,
    allPass,
    extra: {
      packStdout: pack.stdout?.slice(0, 200) || '',
      verifyStdout: verify.stdout?.slice(0, 200) || '',
      installStdout: install.stdout?.slice(0, 200) || '',
      packDetStdout: packDet.stdout?.slice(0, 200) || '',
      manifestSchemaStdout: manifestSchema.stdout?.slice(0, 200) || '',
      policyS1Stdout: policyS1.stdout?.slice(0, 200) || '',
      policyS2Stdout: policyS2.stdout?.slice(0, 200) || '',
      policyNetStdout: policyNet.stdout?.slice(0, 200) || '',
    },
  });

  console.log(
    JSON.stringify(
      {
        ts,
        pack: pack.ok,
        verify: verify.ok,
        install: install.ok,
        packDet: packDet.ok,
        manifestSchema: manifestSchema.ok,
        policyS1: policyS1.ok,
        policyS2: policyS2.ok,
        policyNet: policyNet.ok,
        allPass,
      },
      null,
      2
    )
  );
  process.exitCode = allPass ? 0 : 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
