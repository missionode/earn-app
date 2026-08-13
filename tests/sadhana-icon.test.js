const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('Sadhana uses a compact responsive lotus icon', () => {
  const indexScript = fs.readFileSync('js/index.js', 'utf8');
  const transactionsScript = fs.readFileSync('js/transactions.js', 'utf8');
  const receiveHtml = fs.readFileSync('receive.html', 'utf8');
  const indexStyles = fs.readFileSync('css/index.css', 'utf8');
  const transactionStyles = fs.readFileSync('css/transactions.css', 'utf8');
  const lotus = fs.readFileSync('assets/icons/lotus.svg', 'utf8');

  assert.match(indexScript, /'sadhana': 'assets\/icons\/lotus\.svg'/);
  assert.match(transactionsScript, /'sadhana': 'assets\/icons\/lotus\.svg'/);
  assert.match(receiveHtml, /src="assets\/icons\/lotus\.svg" alt="Sadhana"/);
  assert.match(indexScript, /class="category-icon"/);
  assert.match(transactionsScript, /class="category-icon"/);
  assert.match(indexStyles, /#transactionsTable \.category-icon[\s\S]*width: 24px;[\s\S]*height: 24px;/);
  assert.match(transactionStyles, /#allTransactionsTable \.category-icon[\s\S]*width: 24px;[\s\S]*height: 24px;/);
  assert.match(lotus, /viewBox="0 0 24 24"/);
  assert.doesNotMatch(indexScript, /'sadhana': 'assets\/icons\/Jainism\.svg'/);
});
