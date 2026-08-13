const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('balance uses the lotus prosperity symbol', () => {
  const script = fs.readFileSync('js/index.js', 'utf8');

  assert.match(script, /balanceAds\.textContent = `🪷 \$\{balance\} ₹`/);
  assert.doesNotMatch(script, /balanceAds\.textContent = `⚖️/);
});
