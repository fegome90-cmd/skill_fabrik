import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

test('configs/skill-rules.json conforms to schemas/skill-rules.schema.json', async () => {
  const schemaPath = path.resolve('schemas', 'skill-rules.schema.json');
  const rulesPath = path.resolve('configs', 'skill-rules.json');

  const [schemaRaw, rulesRaw, ajvModule, formatsModule] = await Promise.all([
    readFile(schemaPath, 'utf8'),
    readFile(rulesPath, 'utf8'),
    import(pathToFileURL(path.resolve('packages/daemon/node_modules/ajv/dist/2020.js')).href),
    import(pathToFileURL(path.resolve('packages/daemon/node_modules/ajv-formats/dist/index.js')).href),
  ]);

  const schema = JSON.parse(schemaRaw);
  const rules = JSON.parse(rulesRaw);

  const Ajv = ajvModule.default;
  const addFormats = formatsModule.default;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(rules);
  if (!ok) {
    console.error(validate.errors);
  }
  assert.ok(ok, 'skill-rules.json does not conform to skill-rules.schema.json');
});


