const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('landing page defaults to an income-focused experience', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const styles = fs.readFileSync('css/index.css', 'utf8');
  const script = fs.readFileSync('js/index.js', 'utf8');

  assert.match(html, /class="summary-item expense" hidden/);
  assert.match(html, /id="sendMoneyBtn" class="button" hidden/);
  assert.doesNotMatch(html, /id="quickScanLink"/);
  assert.match(html, /<figcaption>Income<span id="adsSpaceaption"><\/span><\/figcaption>/);
  assert.match(html, /<option value="income" selected>Income<\/option>/);
  assert.match(styles, /#sendMoneyBtn\[hidden\][\s\S]*display: none;/);
  assert.match(script, /filterType\.value = 'income'/);
  assert.match(script, /quickScanLink\.hidden = true/);
});

test('FAQ preserves expense support while marking its refinement as upcoming', () => {
  const faq = fs.readFileSync('faq.html', 'utf8');

  assert.match(faq, /A more refined expense experience is coming soon/);
  assert.match(faq, /Existing expense features and records are preserved/);
});
