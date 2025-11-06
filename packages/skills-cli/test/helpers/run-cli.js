import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const exec = promisify(execFile);
const CLI = path.resolve('packages/skills-cli/dist/index.js');

export async function runCli(args, opts = {}) {
  const result = await exec('node', [CLI, ...args], {
    cwd: process.cwd(),
    env: process.env,
    ...opts,
  });
  return result.stdout;
}
