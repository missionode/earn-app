const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/upi-id.js', 'utf8'), context);

test('all current Google Pay UPI handles are accepted', () => {
  const {EarnUpiId} = context;

  assert.deepEqual(
    Array.from(EarnUpiId.GOOGLE_PAY_HANDLES),
    ['okaxis', 'okhdfcbank', 'okicici', 'oksbi'],
  );
  for (const handle of EarnUpiId.GOOGLE_PAY_HANDLES) {
    assert.equal(EarnUpiId.validate(`meditation${String.fromCharCode(64)}${handle}`), '');
  }
});

test('valid UPI structure is accepted without a brittle domain allowlist', () => {
  const {EarnUpiId} = context;

  assert.equal(EarnUpiId.validate('teacher@newpspbank'), '');
  assert.equal(EarnUpiId.validate('teacher@bank-2'), '');
  assert.equal(EarnUpiId.normalize('teacher@OKAXIS'), 'teacher@okaxis');
});

test('malformed UPI IDs remain rejected', () => {
  const {EarnUpiId} = context;

  for (const upiId of ['', 'teacher', '@okaxis', 'teacher@', 'teacher @okaxis']) {
    assert.equal(EarnUpiId.validate(upiId), 'Invalid UPI ID format.');
  }
});
