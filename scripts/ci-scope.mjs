import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_SENSITIVE_EXACT = new Set([
  'package.json',
  'pnpm-lock.yaml',
  '.github/workflows/ci.yml',
  '.github/workflows/release.yml',
  'scripts/ci-scope.mjs',
]);

const PACKAGE_SENSITIVE_PREFIXES = [
  'bin/',
  'src/',
  'core/',
  'profiles/',
  'schemas/',
  'templates/',
  'adapters/',
];

export function requiresPackageSmoke(paths) {
  return paths.some((path) => (
    PACKAGE_SENSITIVE_EXACT.has(path)
    || PACKAGE_SENSITIVE_PREFIXES.some((prefix) => path.startsWith(prefix))
  ));
}

async function readStdin() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

async function main() {
  const input = await readStdin();
  const paths = input
    .split(/\r?\n/)
    .map((path) => path.trim())
    .filter(Boolean);
  process.stdout.write(`package_smoke=${requiresPackageSmoke(paths) ? 'true' : 'false'}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
