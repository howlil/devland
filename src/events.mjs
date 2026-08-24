import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateCanonical } from './runtime.mjs';

const EVENT_SCHEMA_URL = new URL('../schemas/engineering-event.schema.json', import.meta.url);
export const EVENT_LOG_PATH = '.devland/runtime/events.ndjson';

async function loadValidator() {
  const schema = JSON.parse(await readFile(EVENT_SCHEMA_URL, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function formatValidationErrors(errors = []) {
  return errors
    .map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
    .join('; ');
}

async function readExistingEvents(logPath) {
  let text;
  try {
    text = await readFile(logPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const events = [];
  for (const [index, line] of text.split('\n').entries()) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      throw new Error(`Invalid engineering event log at line ${index + 1}`);
    }
  }
  return events;
}

export async function readEngineeringEvents(projectRoot = process.cwd()) {
  return readExistingEvents(path.join(projectRoot, EVENT_LOG_PATH));
}

export async function appendEngineeringEvent(event, projectRoot = process.cwd()) {
  const canonical = await validateCanonical(projectRoot);
  if (!canonical.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(canonical.errors)}`);
  }

  const validate = await loadValidator();
  if (!validate(event)) {
    throw new Error(`Invalid engineering event: ${formatValidationErrors(validate.errors)}`);
  }

  const logPath = path.join(projectRoot, EVENT_LOG_PATH);
  const existingEvents = await readEngineeringEvents(projectRoot);
  const existing = existingEvents.find((candidate) => candidate.id === event.id);

  if (existing) {
    if (!isDeepStrictEqual(existing, event)) {
      throw new Error(`Engineering event id conflict: ${event.id}`);
    }
    return {
      appended: false,
      path: EVENT_LOG_PATH,
      event,
    };
  }

  await mkdir(path.dirname(logPath), { recursive: true });
  await appendFile(logPath, `${JSON.stringify(event)}\n`, 'utf8');

  return {
    appended: true,
    path: EVENT_LOG_PATH,
    event,
  };
}
