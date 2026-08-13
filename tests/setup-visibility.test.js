const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('Quick Scan is hidden until Earn setup is complete', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const script = fs.readFileSync('js/index.js', 'utf8');
  const styles = fs.readFileSync('css/index.css', 'utf8');

  assert.match(
    html,
    /<a id="quickScanLink" class="quickscan"[^>]* hidden>/,
  );
  assert.match(
    script,
    /quickScanLink\.hidden = isFirstTimeUser\(\)/,
  );
  assert.match(script, /setLocalStorageItem\('earn_serviceCharge'/);
  assert.match(styles, /\.quickscan\[hidden\]\s*{\s*display: none;/);
});
