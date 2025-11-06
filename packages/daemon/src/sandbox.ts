import { resolve, sep, dirname } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';

export interface SandboxFile {
  path: string;
  bytes: number;
}

export interface WritePlan {
  files: SandboxFile[];
  summary: string;
}

const MAX_FILES = 50;
const MAX_BYTES = 1_500_000;

export function sandboxRoot(cwd: string): string {
  const base = typeof cwd === 'string' && cwd.trim().length > 0 ? cwd : '.';
  return resolve(base, 'workspace', 'sandbox');
}

export function canonPath(root: string, relPath: string): string {
  const safeRel = typeof relPath === 'string' ? relPath : '';
  const target = resolve(root, safeRel);
  if (!target.startsWith(root + sep) && target !== root) {
    throw new Error('sandbox_escape');
  }
  return target;
}

export function buildWritePlan(args: unknown): WritePlan {
  const files = Array.isArray((args as any)?.files) ? (args as any).files : [];
  const plan: SandboxFile[] = [];
  let totalBytes = 0;

  for (const entry of files.slice(0, MAX_FILES)) {
    const path = typeof entry?.path === 'string' ? entry.path : '';
    const bytes = Number.isFinite(entry?.bytes) ? Math.max(0, Number(entry.bytes)) : 0;
    const nextTotal = totalBytes + bytes;
    if (nextTotal > MAX_BYTES) break;
    plan.push({ path, bytes });
    totalBytes = nextTotal;
  }

  return {
    files: plan,
    summary: `Will write ${plan.length} file(s), total bytes <= ${totalBytes}`,
  };
}

export async function applyWritePlan(root: string, plan: WritePlan): Promise<void> {
  for (const file of plan.files) {
    const target = canonPath(root, file.path);
    const parent = dirname(target);
    await mkdir(parent, { recursive: true });
    await writeFile(target, Buffer.alloc(file.bytes));
  }
}
