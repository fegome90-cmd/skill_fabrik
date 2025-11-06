import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('generated manifest matches JSON schema', async () => {
  await rm('.registry', { recursive: true, force: true }).catch(() => {});

  execFileSync('node', [
    'packages/skills-cli/dist/index.js',
    'skills',
    'pack',
    'skills/repo-auditor',
    '--out',
    '.registry',
  ], { stdio: 'inherit' });

  const schemaPath = path.resolve('schemas', 'skill-manifest.schema.json');
  const manifestFile = (await readdir('.registry')).find(file => file.endsWith('.manifest.json'));
  if (!manifestFile) {
    throw new Error('Manifest not produced by packaging command');
  }
  const manifestPath = path.resolve('.registry', manifestFile);

  const [schemaRaw, manifestRaw, ajvModule, formatsModule] = await Promise.all([
    readFile(schemaPath, 'utf8'),
    readFile(manifestPath, 'utf8'),
    import(pathToFileURL(path.resolve('packages/daemon/node_modules/ajv/dist/2020.js')).href),
    import(pathToFileURL(path.resolve('packages/daemon/node_modules/ajv-formats/dist/index.js')).href),
  ]);

  const schema = JSON.parse(schemaRaw);
  const manifest = JSON.parse(manifestRaw);

  const Ajv = ajvModule.default;
  const addFormats = formatsModule.default;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(manifest);
  if (!ok) {
    console.error(validate.errors);
  }
  assert.ok(ok, 'Generated manifest does not conform to schema');
});
