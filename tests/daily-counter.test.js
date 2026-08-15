const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/daily-counter.js', 'utf8'), context);

test('daily counter starts from the day Earn came into existence', () => {
  const {EarnDailyCounter} = context;

  assert.deepEqual(
    JSON.parse(JSON.stringify(EarnDailyCounter.EARN_FOUNDING_DATE)),
    {year: 2025, month: 4, day: 11},
  );
  assert.equal(EarnDailyCounter.getValue(new Date(2025, 4, 11, 23, 59)), 0);
});

test('daily counter generates exactly one additional value each calendar day', () => {
  const {EarnDailyCounter} = context;

  assert.equal(EarnDailyCounter.getValue(new Date(2026, 7, 15, 12)), 461);
  assert.equal(EarnDailyCounter.getValue(new Date(2026, 7, 16, 0)), 462);
});
