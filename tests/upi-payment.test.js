const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const loadUpiModule = () => {
  const context = {URL};
  vm.runInNewContext(fs.readFileSync('js/upi.js', 'utf8'), context);
  return context.EarnUpi;
};

test('preserves merchant QR parameters for Google Pay compatibility', () => {
  const upi = loadUpiModule();
  const source = 'upi://pay?pa=shop%40axisbank&pn=Meditation+Centre' +
    '&mc=8099&tr=ORDER123&tn=Original+merchant+note&am=500.00' +
    '&cu=INR&url=https%3A%2F%2Fmerchant.example%2Forders%2F123&mode=02';

  const payment = upi.buildUpiPaymentUri(source, {
    amount: 500,
    description: 'Replacement note',
    referenceUrl: 'https://missionode.github.io/earn-app/index.html',
    transactionId: 'EARN123',
  });
  const result = new URL(payment.uri);

  assert.equal(result.searchParams.get('pa'), 'shop@axisbank');
  assert.equal(result.searchParams.get('pn'), 'Meditation Centre');
  assert.equal(result.searchParams.get('mc'), '8099');
  assert.equal(result.searchParams.get('tr'), 'ORDER123');
  assert.equal(result.searchParams.get('tn'), 'Original merchant note');
  assert.equal(result.searchParams.get('am'), '500.00');
  assert.equal(result.searchParams.get('cu'), 'INR');
  assert.equal(
    result.searchParams.get('url'),
    'https://merchant.example/orders/123',
  );
  assert.equal(result.searchParams.get('mode'), '02');
});

test('adds bounded defaults only when a static personal QR omits them', () => {
  const upi = loadUpiModule();
  const payment = upi.buildUpiPaymentUri(
    'upi://pay?pa=person%40upi&pn=Person',
    {
      amount: '125.5',
      description: 'x'.repeat(100),
      referenceUrl: 'https://missionode.github.io/earn-app/index.html',
      transactionId: 'EARN456',
    },
  );
  const result = new URL(payment.uri);

  assert.equal(result.searchParams.get('pa'), 'person@upi');
  assert.equal(result.searchParams.get('am'), '125.50');
  assert.equal(result.searchParams.get('cu'), 'INR');
  assert.equal(result.searchParams.get('mc'), '0000');
  assert.equal(result.searchParams.get('tr'), 'EARN456');
  assert.equal(
    result.searchParams.get('url'),
    'https://missionode.github.io/earn-app/index.html',
  );
  assert.equal(result.searchParams.get('tn').length, 80);
});

test('rejects a mismatch with a dynamic QR amount', () => {
  const upi = loadUpiModule();

  assert.throws(
    () => upi.buildUpiPaymentUri(
      'upi://pay?pa=shop@bank&pn=Shop&am=500&cu=INR',
      {
        amount: 600,
        description: '',
        referenceUrl: 'https://missionode.github.io/earn-app/index.html',
        transactionId: 'EARN789',
      },
    ),
    /QR requests ₹500\.00, but you entered ₹600\.00/,
  );
});

test('does not mutate signed QR requests', () => {
  const upi = loadUpiModule();
  const source = 'upi://pay?pa=shop@bank&pn=Shop&am=25.00&cu=INR&sign=abc123';
  const payment = upi.buildUpiPaymentUri(source, {
    amount: 25,
    description: 'Ignored because signed',
    referenceUrl: 'https://missionode.github.io/earn-app/index.html',
    transactionId: 'EARN999',
  });

  assert.equal(payment.uri, source);
});

test('payment return remains pending until manual confirmation', () => {
  const indexScript = fs.readFileSync('js/index.js', 'utf8');
  const sendScript = fs.readFileSync('js/send.js', 'utf8');

  assert.doesNotMatch(indexScript, /updateTransactionStatus\(transactionIdFromUrl/);
  assert.match(indexScript, /triggerConfirmationPopup\(\)/);
  assert.match(indexScript, /url\.searchParams\.delete\('tx'\)/);
  assert.match(sendScript, /sessionStorage\.setItem\('earn_upi_return_pending'/);
  assert.match(sendScript, /index\.html\?upiReturn=1/);
});
