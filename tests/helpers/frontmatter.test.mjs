import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFrontmatter } from './frontmatter.mjs';

test('frontmatter parser accepts CRLF content from Windows checkouts', () => {
  const input = '---\r\nid: core.example\r\nscope: core\r\n---\r\n# Example\r\n';
  const { metadata, body } = parseFrontmatter(input);

  assert.deepEqual(metadata, { id: 'core.example', scope: 'core' });
  assert.equal(body, '# Example\n');
});
