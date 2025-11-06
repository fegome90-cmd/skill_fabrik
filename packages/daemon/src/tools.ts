import { execFile as _execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

const execFile = promisify(_execFile);

export async function fsRead(path: string): Promise<string> {
  return (await readFile(path, 'utf-8')).slice(0, 200_000);
}

export async function gitStatus(cwd = '.'): Promise<string> {
  const { stdout } = await execFile('git', ['status', '--porcelain=v1'], { cwd });
  return stdout;
}

export async function gitDiff(cwd = '.', max = 200_000): Promise<string> {
  const { stdout } = await execFile('git', ['diff', '--no-color', '--unified=0'], { cwd });
  return stdout.slice(0, max);
}

