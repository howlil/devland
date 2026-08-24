#!/usr/bin/env node

import { doctorProject } from '../src/doctor.mjs';
import { appendEngineeringEvent, ingestEngineeringEvents } from '../src/events.mjs';
import { flowReport } from '../src/metrics.mjs';
import { normalizeGitHubEvidence } from '../src/providers/github.mjs';
import { resolveContext, validateCanonical } from '../src/runtime.mjs';

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid ${label} JSON`);
  }
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

  if (command === 'flow') {
    print(await flowReport());
    return;
  }

  if (command === 'context') {
    if (!argument) {
      fail('Usage: devland context <workflow> [change-json]');
      return;
    }
    const change = value ? parseJson(value, 'change descriptor') : null;
    print(await resolveContext(argument, undefined, undefined, change));
    return;
  }

  if (command === 'event' && argument === 'append') {
    if (!value) {
      fail('Usage: devland event append <json>');
      return;
    }
    print(await appendEngineeringEvent(parseJson(value, 'engineering event')));
    return;
  }

  if (command === 'ingest' && argument === 'github') {
    if (!value) {
      fail('Usage: devland ingest github <json>');
      return;
    }
    const events = normalizeGitHubEvidence(parseJson(value, 'GitHub evidence'));
    const result = await ingestEngineeringEvents(events);
    print({
      provider: 'github',
      normalized_events: events.length,
      appended: result.appended,
      total: result.total,
      path: result.path,
    });
    return;
  }

  fail('Usage: devland <validate|doctor|flow|context <workflow> [change-json]|event append <json>|ingest github <json>>');
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
