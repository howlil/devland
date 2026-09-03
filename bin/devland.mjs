#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { toPortableContext } from '../src/context-contract.mjs';
import { doctorProject } from '../src/doctor.mjs';
import { appendEngineeringEvent, ingestEngineeringEvents } from '../src/events.mjs';
import { evaluateAdapterParity } from '../src/evals/adapters.mjs';
import { flowReport } from '../src/metrics.mjs';
import { normalizeGitHubEvidence } from '../src/providers/github.mjs';
import { resolveContext, validateCanonical } from '../src/runtime.mjs';
import { initializeProject, migrateProject } from '../src/setup.mjs';

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

async function readJsonFile(filePath, label) {
  let value;
  try {
    value = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read ${label} file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return parseJson(value, label);
}

function parseContextArgs(args) {
  if (args.length === 0) {
    throw new Error('Usage: devland context <workflow> [change-json] [--work <work-json-file>]');
  }

  let index = 0;
  let workflow = 'develop-change';
  if (args[index] !== '--work') {
    workflow = args[index];
    index += 1;
  }

  let change = null;
  if (index < args.length && args[index] !== '--work') {
    change = parseJson(args[index], 'change descriptor');
    index += 1;
  }

  let workPath = null;
  while (index < args.length) {
    if (args[index] !== '--work' || !args[index + 1]) {
      throw new Error('Usage: devland context <workflow> [change-json] [--work <work-json-file>]');
    }
    if (workPath) throw new Error('devland context accepts only one --work file');
    workPath = args[index + 1];
    index += 2;
  }

  return { workflow, change, workPath };
}

async function main() {
  const argv = process.argv.slice(2);
  const [command, argument, value] = argv;

  if (command === 'init') {
    if (!argument) {
      fail('Usage: devland init <project-name>');
      return;
    }
    print(await initializeProject(argument));
    return;
  }

  if (command === 'migrate') {
    print(await migrateProject());
    return;
  }

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
    const { workflow, change, workPath } = parseContextArgs(argv.slice(1));
    const work = workPath ? await readJsonFile(workPath, 'work envelope') : null;
    print(toPortableContext(await resolveContext(workflow, undefined, undefined, change, work)));
    return;
  }

  if (command === 'eval' && argument === 'adapters') {
    const change = value ? parseJson(value, 'change descriptor') : null;
    const context = await resolveContext('develop-change', undefined, undefined, change);
    const report = evaluateAdapterParity(context, ['generic', 'agents-md'], ['repository.read']);
    print(report);
    if (report.status !== 'pass') process.exitCode = 1;
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

  fail('Usage: devland <init <project-name>|migrate|validate|doctor|flow|context <workflow> [change-json] [--work <work-json-file>]|eval adapters [change-json]|event append <json>|ingest github <json>>');
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
