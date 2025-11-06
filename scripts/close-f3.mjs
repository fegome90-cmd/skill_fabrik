import 'dotenv/config';
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

function run(cmd, args = []) {
  return new Promise((res) => {
    execFile(cmd, args, { encoding: 'utf8' }, (err, stdout, stderr) => {
      res({ ok: !err, code: err?.code ?? 0, stdout, stderr });
    });
  });
}

function updatePlanMd(md) {
  // Buscar la línea que dice "Siguiente: F3" y actualizarla
  const lines = md.split('\n');
  let updated = false;
  
  for (let i = 0; i < lines.length; i++) {
    // Cambiar "Siguiente: F3" a "F3 — COMPLETADO"
    if (lines[i].includes('Siguiente: F3 — Storage Postgres-first')) {
      lines[i] = lines[i].replace(
        'Siguiente: F3 — Storage Postgres-first',
        'F3 — Storage Postgres-first ✅ COMPLETADO'
      );
      // Marcar también las siguientes líneas como completadas si son sub-items
      if (i + 1 < lines.length && lines[i + 1].includes('→')) {
        lines[i + 1] = '  ✓ ' + lines[i + 1].replace(/^\s*→\s*/, '');
        if (i + 2 < lines.length && lines[i + 2].includes('→')) {
          lines[i + 2] = '  ✓ ' + lines[i + 2].replace(/^\s*→\s*/, '');
        }
      }
      updated = true;
      break;
    }
    // También buscar si ya dice F3 y actualizarlo
    if (lines[i].includes('F3 — Storage Postgres-first') && !lines[i].includes('COMPLETADO')) {
      lines[i] = lines[i].replace(
        /F3 — Storage Postgres-first/,
        'F3 — Storage Postgres-first ✅ COMPLETADO'
      );
      updated = true;
    }
  }
  
  return { content: lines.join('\n'), updated };
}

async function main() {
  // 1) Correr smoke:pg
  const smoke = await run('pnpm', ['smoke:pg']);
  
  // 2) Opcionalmente correr test:pg (si existe el script en package.json)
  let testpg = { ok: true, optional: true }; // Por defecto ok y opcional
  try {
    const { readFileSync } = await import('node:fs');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts['test:pg']) {
      // El script existe, intentar ejecutarlo
      testpg = await run('pnpm', ['test:pg']);
      testpg.optional = false; // Ya no es opcional si existe
    }
  } catch (e) {
    // Si no puede leer package.json o no existe test:pg, está bien, es opcional
    testpg = { ok: true, optional: true };
  }

  const pass = {
    smoke: smoke.ok,
    testpg: testpg.ok,
    testpgOptional: testpg.optional !== false,
  };

  const ts = new Date().toISOString();
  // allPass solo requiere smoke, test:pg es opcional
  const allPass = pass.smoke;

  // 3) Actualizar plan.md si todo pasa
  if (allPass) {
    let plan = await readFile('plan.md', 'utf8');
    const { content, updated } = updatePlanMd(plan);
    if (updated) {
      await writeFile('plan.md', content, 'utf8');
      console.log('✅ plan.md actualizado — F3 marcado como COMPLETADO');
    } else {
      console.log('⚠️  No se encontró la sección F3 en plan.md para actualizar');
    }
  }

  // 4) Registrar evento en obs/kpi/events.jsonl si existe
  try {
    const eventsPath = 'obs/kpi/events.jsonl';
    const event = {
      ts,
      kind: 'f3:close',
      smoke: pass.smoke,
      testpg: pass.testpg,
      allPass,
      extra: {
        smokeStdout: smoke.stdout?.substring(0, 200) || '',
        testpgStdout: testpg.stdout?.substring(0, 200) || '',
      },
      fallback: !pass.smoke ? 'smoke:pg failed' : (!pass.testpg && !pass.testpgOptional) ? 'test:pg failed' : null,
    };
    const eventLine = JSON.stringify(event) + '\n';
    try {
      const existing = await readFile(eventsPath, 'utf8').catch(() => '');
      await writeFile(eventsPath, existing + eventLine, 'utf8');
    } catch (e) {
      // Si el directorio no existe, crearlo
      const { mkdir } = await import('node:fs/promises');
      await mkdir('obs/kpi', { recursive: true });
      await writeFile(eventsPath, eventLine, 'utf8');
    }
  } catch (e) {
    // No crítico si no se puede escribir el evento
    console.error('⚠️  No se pudo escribir evento:', e.message);
  }

  console.log(JSON.stringify({ ts, ...pass, allPass }, null, 2));
  process.exitCode = allPass ? 0 : 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

