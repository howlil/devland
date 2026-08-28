export const DEVLAND_CONTEXT_SCHEMA = 'devland.context/v1';

export function toPortableContext(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    throw new Error('Resolved Devland context must be an object');
  }

  return {
    ...context,
    schema: DEVLAND_CONTEXT_SCHEMA,
  };
}
