const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('Quick Scan remains hidden on the income-focused landing page', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const script = fs.readFileSync('js/index.js', 'utf8');
  const styles = fs.readFileSync('css/index.css', 'utf8');

  assert.match(
    html,
    /<a id="quickScanLink" class="quickscan expense-feature"[^>]* hidden>/,
  );
  assert.match(
    script,
    /quickScanLink\.hidden = true/,
  );
  assert.match(script, /setLocalStorageItem\('earn_serviceCharge'/);
  assert.match(styles, /\.quickscan\[hidden\]\s*{\s*display: none;/);
});
