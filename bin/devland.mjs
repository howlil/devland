#!/usr/bin/env node

import { doctorProject } from '../src/doctor.mjs';
import { appendEngineeringEvent } from '../src/events.mjs';
import { resolveContext, validateCanonical } from '../src/runtime.mjs';

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

async function main() {
  const [command, argument, value] = process.argv.slice(2);

  if (command === 'validate') {
    const result = await validateCanonical();
    print({ valid: result.valid, validated: result.validated, errors: result.errors });
    if (!result.valid) process.exitCode = 1;
    return;
  }

  if (command === 'doctor') {
    print(await doctorProject());
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

  if (command === 'event' && argument === 'append') {
    if (!value) {
      fail('Usage: devland event append <json>');
      return;
    }

    let event;
    try {
      event = JSON.parse(value);
    } catch {
      fail('Invalid engineering event JSON');
      return;
    }

    print(await appendEngineeringEvent(event));
    return;
  }

  fail('Usage: devland <validate|doctor|context <workflow>|event append <json>>');
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
