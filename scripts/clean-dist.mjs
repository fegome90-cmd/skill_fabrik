#!/usr/bin/env node
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const PACKAGES = ['packages/daemon', 'packages/skills-cli'];

async function removeDist(dir) {
  const target = join(dir, 'dist');
  await rm(target, { recursive: true, force: true });
}

await Promise.all(PACKAGES.map(removeDist));
