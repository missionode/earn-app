const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const {
  STORAGE_KEY,
  TRANSACTION_ID,
  normalizeAmount,
  syncOpeningBalance,
} = require('../js/opening-balance.js');

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test('opening balance creates one successful income transaction', () => {
  const storage = createStorage();
  const now = new Date('2026-08-15T09:10:11');

  const transaction = syncOpeningBalance(storage, '1250.50', now);
  const transactions = JSON.parse(storage.getItem('earn_transactions'));

  assert.equal(storage.getItem(STORAGE_KEY), '1250.5');
  assert.equal(transactions.length, 1);
  assert.deepEqual(transaction, {
    id: TRANSACTION_ID,
    type: 'income',
    amount: 1250.5,
    category: 'cash',
    description: 'Opening balance',
    date: '2026-08-15',
    time: '09:10:11',
    status: 'success',
    isOpeningBalance: true,
  });
});

test('updating opening balance changes the same transaction without duplication', () => {
  const storage = createStorage();
  syncOpeningBalance(storage, 500, new Date('2026-08-15T09:00:00'));
  syncOpeningBalance(storage, 800, new Date('2026-08-16T10:00:00'));

  const transactions = JSON.parse(storage.getItem('earn_transactions'));
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].id, TRANSACTION_ID);
  assert.equal(transactions[0].amount, 800);
  assert.equal(transactions[0].date, '2026-08-15');
  assert.equal(transactions[0].time, '09:00:00');
});

test('zero opening balance removes its transaction but preserves other income', () => {
  const income = {
    id: 'income-1',
    type: 'income',
    amount: 300,
    status: 'success',
  };
  const storage = createStorage({ earn_transactions: JSON.stringify([income]) });
  syncOpeningBalance(storage, 500, new Date('2026-08-15T09:00:00'));
  syncOpeningBalance(storage, 0);

  assert.equal(storage.getItem(STORAGE_KEY), '0');
  assert.deepEqual(JSON.parse(storage.getItem('earn_transactions')), [income]);
});

test('opening balance rejects negative and invalid values', () => {
  assert.throws(() => normalizeAmount(-1), /non-negative/);
  assert.throws(() => normalizeAmount('not-a-number'), /non-negative/);
});

test('opening balance helper is loaded on home and transaction pages and cached offline', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  const transactions = fs.readFileSync('transactions.html', 'utf8');
  const serviceWorker = fs.readFileSync('js/sw.js', 'utf8');
  const transactionScript = fs.readFileSync('js/transactions.js', 'utf8');

  assert.match(home, /js\/opening-balance\.js/);
  assert.match(transactions, /js\/opening-balance\.js/);
  assert.match(serviceWorker, /js\/opening-balance\.js/);
  assert.match(transactionScript, /EarnOpeningBalance\.syncOpeningBalance\(localStorage, 0\)/);
});
