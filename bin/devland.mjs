#!/usr/bin/env node

import { resolveContext, validateCanonical } from '../src/runtime.mjs';

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

async function main() {
  const [command, argument] = process.argv.slice(2);

  if (command === 'validate') {
    const result = await validateCanonical();
    print({ valid: result.valid, validated: result.validated, errors: result.errors });
    if (!result.valid) process.exitCode = 1;
    return;
  }

  if (command === 'context') {
    if (!argument) {
      fail('Usage: devland context <workflow>');
      return;
    }
    print(await resolveContext(argument));
    return;
  }

  fail('Usage: devland <validate|context <workflow>>');
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
