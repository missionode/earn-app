const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('every app page uses the Earn logo-mark favicon', () => {
  const pages = [
    'data.html',
    'faq.html',
    'index.html',
    'quickscan.html',
    'receive-qr.html',
    'receive.html',
    'reset.html',
    'send.html',
    'splash.html',
    'subscription.html',
    'transactions.html',
  ];
  const faviconLink = /<link rel="icon" type="image\/svg\+xml" href="favicon\.svg">/;

  for (const page of pages) {
    assert.match(fs.readFileSync(page, 'utf8'), faviconLink, page);
  }

  const favicon = fs.readFileSync('favicon.svg', 'utf8');
  assert.match(favicon, /viewBox="0 0 64 64"/);
  assert.match(favicon, /fill="#007AFF"/);
  assert.match(favicon, /stroke="#FFFFFF"/);
});
