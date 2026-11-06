// Checks the post link tidying (functions/_lib/portfolio.js). Run: npm run test:portfolio
import assert from 'node:assert/strict';
import { normalizeLink } from '../functions/_lib/portfolio.js';

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
};

ok('blank stays blank', () => {
  assert.equal(normalizeLink(''), '');
  assert.equal(normalizeLink('   '), '');
  assert.equal(normalizeLink(undefined), '');
});
ok('adds https:// when it is missing', () => {
  assert.equal(normalizeLink('ospreyvisuals.com'), 'https://ospreyvisuals.com/');
  assert.equal(normalizeLink(' www.example.com/work '), 'https://www.example.com/work');
});
ok('keeps full addresses', () => {
  assert.equal(normalizeLink('https://ospreyvisuals.com/'), 'https://ospreyvisuals.com/');
  assert.equal(normalizeLink('http://example.com/a?b=1'), 'http://example.com/a?b=1');
});
ok('refuses anything that is not a web address', () => {
  for (const bad of ['javascript:alert(1)', 'mailto:a@b.com', 'data:text/html,hi', 'hello', 'https://user:pw@example.com', 'ftp://example.com']) {
    assert.throws(() => normalizeLink(bad), /web address/, bad);
  }
});
ok('refuses very long links', () => {
  assert.throws(() => normalizeLink(`https://example.com/${'a'.repeat(400)}`), /too long/);
});

console.log(`\nportfolio: ${passed} checks passed`);
