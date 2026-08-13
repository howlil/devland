import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

export async function createValidator(schemaPath) {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return ajv.compile(schema);
}
