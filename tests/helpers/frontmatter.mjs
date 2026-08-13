import YAML from 'yaml';

export function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) {
    throw new Error('missing frontmatter');
  }

  const end = text.indexOf('\n---\n', 4);
  if (end === -1) {
    throw new Error('unterminated frontmatter');
  }

  const metadata = YAML.parse(text.slice(4, end));
  const body = text.slice(end + 5);
  return { metadata, body };
}
