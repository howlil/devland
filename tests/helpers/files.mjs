import { readFile } from 'node:fs/promises';
import YAML from 'yaml';

export async function readText(path) {
  return readFile(path, 'utf8');
}

export async function readYaml(path) {
  return YAML.parse(await readText(path));
}
