import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as yaml from 'yaml';

export type SkillMeta = {
  id: string;
  allowedTools?: string[];
  scripts?: { run?: string; dryRun?: string };
};

export async function loadSkillMeta(id: string): Promise<SkillMeta> {
  const base = resolve(process.cwd(), 'skills', id);
  // manifest JSON prioritario
  try {
    const m = JSON.parse(await readFile(resolve(base, 'skill-manifest.json'), 'utf-8'));
    return {
      id: (m.id as string) || id,
      allowedTools: (m['allowed-tools'] as string[]) || (m.allowedTools as string[]) || [],
      scripts: m.scripts
        ? {
            run: typeof m.scripts.run === 'string' ? m.scripts.run : undefined,
            dryRun:
              typeof m.scripts['dry-run'] === 'string'
                ? m.scripts['dry-run']
                : typeof m.scripts.dryRun === 'string'
                ? m.scripts.dryRun
                : undefined,
          }
        : {},
    };
  } catch {}

  // 2) SKILL.md (frontmatter YAML) estricto
  try {
    const md = await readFile(resolve(base, 'SKILL.md'), 'utf-8');
    if (md.startsWith('---')) {
      const end = md.indexOf('\n---', 3);
      const fm = end !== -1 ? md.slice(3, end).trim() : '';
      const obj: any = fm ? yaml.parse(fm) : {};
      const allowed = Array.isArray(obj?.['allowed-tools']) ? obj['allowed-tools'].map(String) : [];
      const scripts = obj?.scripts || {};
      return { id, allowedTools: allowed, scripts: { run: scripts.run, dryRun: scripts['dry-run'] } };
    }
  } catch {}

  return { id, allowedTools: [], scripts: {} };
}
