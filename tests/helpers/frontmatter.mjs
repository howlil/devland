import YAML from 'yaml';

export function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error('missing frontmatter');
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    throw new Error('unterminated frontmatter');
  }

  const metadata = YAML.parse(normalized.slice(4, end));
  const body = normalized.slice(end + 5);
  return { metadata, body };
}
