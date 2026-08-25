import { appendFile, mkdir, open, readFile, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateCanonical } from './runtime.mjs';

const EVENT_SCHEMA_URL = new URL('../schemas/engineering-event.schema.json', import.meta.url);
export const EVENT_LOG_PATH = '.devland/runtime/events.ndjson';
const EVENT_LOCK_PATH = '.devland/runtime/events.lock';

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

function assertRealTimestamp(event) {
  if (!Number.isFinite(Date.parse(event.occurred_at))) {
    throw new Error(`Invalid engineering event timestamp: ${event.occurred_at}`);
  }
}

function assertCanonicalSource(event) {
  if (event.source.trim() !== event.source) {
    throw new Error(`Invalid engineering event source: source must not contain leading or trailing whitespace`);
  }
}

function validateEventWith(event, validate) {
  if (!validate(event)) {
    throw new Error(`Invalid engineering event: ${formatValidationErrors(validate.errors)}`);
  }
  assertRealTimestamp(event);
  assertCanonicalSource(event);
}

async function readExistingEvents(logPath, validate) {
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
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error(`Invalid engineering event log at line ${index + 1}: invalid JSON`);
    }
    try {
      validateEventWith(event, validate);
    } catch (error) {
      throw new Error(`Invalid engineering event log at line ${index + 1}: ${error.message}`);
    }
    events.push(event);
  }
  return events;
}

async function withEventLock(projectRoot, fn) {
  const lockPath = path.join(projectRoot, EVENT_LOCK_PATH);
  await mkdir(path.dirname(lockPath), { recursive: true });
  const deadline = Date.now() + 3000;
  let handle;

  while (!handle) {
    try {
      handle = await open(lockPath, 'wx');
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw new Error('Engineering event ingestion lock timeout');
      await delay(10);
    }
  }

  try {
    return await fn();
  } finally {
    await handle.close();
    await rm(lockPath, { force: true });
  }
}

export async function readEngineeringEvents(projectRoot = process.cwd()) {
  const validate = await loadValidator();
  const logPath = path.join(projectRoot, EVENT_LOG_PATH);
  return withEventLock(projectRoot, () => readExistingEvents(logPath, validate));
}

export async function ingestEngineeringEvents(events, projectRoot = process.cwd()) {
  if (!Array.isArray(events)) throw new Error('Engineering event batch must be an array');

  const canonical = await validateCanonical(projectRoot);
  if (!canonical.valid) {
    throw new Error(`Canonical context is invalid: ${JSON.stringify(canonical.errors)}`);
  }

  const validate = await loadValidator();
  for (const event of events) validateEventWith(event, validate);

  const logPath = path.join(projectRoot, EVENT_LOG_PATH);
  return withEventLock(projectRoot, async () => {
    const existingEvents = await readExistingEvents(logPath, validate);
    const byId = new Map(existingEvents.map((event) => [event.id, event]));
    const additions = [];

    for (const event of events) {
      const existing = byId.get(event.id);
      if (existing) {
        if (!isDeepStrictEqual(existing, event)) {
          throw new Error(`Engineering event id conflict: ${event.id}`);
        }
        continue;
      }
      byId.set(event.id, event);
      additions.push(event);
    }

    if (additions.length > 0) {
      await appendFile(logPath, `${additions.map((event) => JSON.stringify(event)).join('\n')}\n`, 'utf8');
    }

    return {
      appended: additions.length,
      total: existingEvents.length + additions.length,
      path: EVENT_LOG_PATH,
    };
  });
}

export async function appendEngineeringEvent(event, projectRoot = process.cwd()) {
  const result = await ingestEngineeringEvents([event], projectRoot);
  return {
    appended: result.appended === 1,
    path: EVENT_LOG_PATH,
    event,
  };
}
