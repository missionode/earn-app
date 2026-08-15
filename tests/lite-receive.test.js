const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

class StorageMock {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  removeItem(key) {
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

const createElement = (overrides = {}) => {
  const classes = new Set();
  return {
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    checked: false,
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
    },
    focus() {},
    hidden: false,
    href: '',
    listeners: {},
    readOnly: false,
    select() {},
    value: '',
    ...overrides,
  };
};

const runReceivePage = (storageEntries = {}, search = '?Source=Lite') => {
  const ids = [
    'receiveForm',
    'amount',
    'description',
    'clients',
    'clientsGroup',
    'categorySadhana',
    'customReceiptButton',
    'toggleDetailsReceive',
    'detailsToggleReceive',
    'detailsFieldsReceive',
    'liteAmountHelp',
    'receiveBackLink',
    'coinRainContainer',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, createElement()]));
  elements.clients.value = '1';
  elements.categorySadhana.value = 'sadhana';
  const sadhanaLabel = createElement();
  const iconGrid = createElement();
  const location = {
    href: '',
    replace(url) {
      this.replacedWith = url;
    },
    search,
  };
  let readyHandler;
  const document = {
    addEventListener(type, handler) {
      if (type === 'DOMContentLoaded') readyHandler = handler;
    },
    getElementById(id) {
      return elements[id] || null;
    },
    querySelector(selector) {
      if (selector === '.lite-only-category') return sadhanaLabel;
      if (selector === '.icon-grid') return iconGrid;
      if (selector === 'input[name="category"]:checked') {
        return elements.categorySadhana.checked ? elements.categorySadhana : null;
      }
      return null;
    },
  };
  const localStorage = new StorageMock(storageEntries);
  const celebrations = [];
  const context = {
    alert() {},
    console,
    document,
    EarnDailyCounter: {getValue: () => 461},
    EarnProsperityCelebration: {
      play(options) {
        celebrations.push(options);
        options.onComplete();
      },
    },
    localStorage,
    setTimeout(handler) {
      handler();
    },
    URLSearchParams,
    window: {location},
  };

  vm.runInNewContext(fs.readFileSync('js/receive.js', 'utf8'), context);
  readyHandler();
  return {celebrations, elements, localStorage, location, sadhanaLabel};
};

test('Lite receive uses the locked daily counter and recalculates by clients', () => {
  const page = runReceivePage();

  assert.equal(page.elements.description.value, 'Dakshina recieved for meditation');
  assert.equal(page.elements.categorySadhana.checked, true);
  assert.equal(page.elements.amount.value, '461.00');
  assert.equal(page.elements.amount.readOnly, true);
  assert.equal(page.elements.clientsGroup.hidden, false);
  assert.equal(page.elements.detailsToggleReceive.hidden, true);
  assert.equal(
    page.elements.receiveBackLink.href,
    'https://missionode.github.io/lite/index.html',
  );

  page.elements.clients.value = '3';
  page.elements.clients.listeners.input();
  assert.equal(page.elements.amount.value, '1383.00');

  page.elements.receiveForm.listeners.submit({preventDefault() {}});
  const pending = JSON.parse(
    page.localStorage.getItem('pending_receive_transaction'),
  );
  assert.equal(pending.amount, 1383);
  assert.equal(pending.category, 'sadhana');
  assert.equal(pending.clients, 3);
  assert.equal(pending.serviceCharge, 461);
  assert.equal(pending.source, 'Lite');
  assert.equal(page.location.href, 'receive-qr.html?Source=Lite');
});

test('Lite receive does not require a manually saved service charge', () => {
  const page = runReceivePage();
  assert.equal(page.location.replacedWith, undefined);
  assert.equal(page.elements.amount.value, '461.00');
});

test('Lite custom receipt saves, celebrates the full counter, and returns to Earn', () => {
  const page = runReceivePage();
  page.elements.customReceiptButton.listeners.click();

  const transactions = JSON.parse(
    page.localStorage.getItem('earn_transactions'),
  );
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].amount, 461);
  assert.equal(page.celebrations.length, 1);
  assert.equal(page.celebrations[0].count, 461);
  assert.equal(page.location.href, 'index.html');
});

test('ordinary Add Income remains outside Lite and returns to Earn after celebrating', () => {
  const page = runReceivePage({}, '');
  page.elements.amount.value = '125';
  page.elements.customReceiptButton.listeners.click();

  const transactions = JSON.parse(
    page.localStorage.getItem('earn_transactions'),
  );
  assert.equal(transactions[0].amount, 125);
  assert.equal(transactions[0].source, undefined);
  assert.equal(page.celebrations[0].count, 461);
  assert.equal(page.location.href, 'index.html');
});

test('Lite receive restores pending details when returning to edit', () => {
  const pending = {
    source: 'Lite',
    clients: 4,
    description: 'Updated meditation description',
  };
  const page = runReceivePage({
    pending_receive_transaction: JSON.stringify(pending),
  });

  assert.equal(page.elements.clients.value, 4);
  assert.equal(page.elements.amount.value, '1844.00');
  assert.equal(
    page.elements.description.value,
    'Updated meditation description',
  );
});

test('Lite receive replaces a stale pending amount with today’s calculation', () => {
  const pending = {
    source: 'Lite',
    amount: 1050,
    clients: 4,
    description: 'Dakshina recieved for meditation',
  };
  const page = runReceivePage({
    pending_receive_transaction: JSON.stringify(pending),
  });

  assert.equal(page.elements.amount.value, '1844.00');
  page.elements.clients.value = '5';
  page.elements.clients.listeners.input();
  assert.equal(page.elements.amount.value, '2305.00');
});

test('Lite QR completion saves, celebrates, and returns to Earn', () => {
  const ids = [
    'qrCodeContainer',
    'amountDisplay',
    'descriptionDisplay',
    'payeeNameDisplay',
    'doneButton',
    'cancelButton',
    'editPaymentLink',
    'receiveQrBackLink',
    'coinRainContainer',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, createElement()]));
  let readyHandler;
  const document = {
    addEventListener(type, handler) {
      if (type === 'DOMContentLoaded') readyHandler = handler;
    },
    getElementById(id) {
      return elements[id];
    },
  };
  const pending = {
    amount: 500,
    category: 'sadhana',
    description: 'Dakshina recieved for meditation',
  };
  const localStorage = new StorageMock({
    earn_upiId: 'meditation@upi',
    earn_username: 'Meditation Teacher',
    pending_receive_transaction: JSON.stringify(pending),
  });
  const location = {href: '', search: '?Source=Lite'};
  let historyBackCalls = 0;
  const history = {
    back() {
      historyBackCalls += 1;
    },
    length: 2,
  };
  let qrOptions;
  function QRCode(container, options) {
    qrOptions = options;
  }
  QRCode.CorrectLevel = {H: 'H'};
  const context = {
    alert() {},
    console,
    document,
    EarnDailyCounter: {getValue: () => 461},
    EarnProsperityCelebration: {
      play(options) {
        options.onComplete();
      },
    },
    localStorage,
    QRCode,
    URLSearchParams,
    window: {history, location},
  };

  vm.runInNewContext(fs.readFileSync('js/receive-qr.js', 'utf8'), context);
  readyHandler();

  assert.match(qrOptions.text, /am=500\.00/);
  assert.match(qrOptions.text, /Dakshina%20recieved%20for%20meditation/);
  assert.equal(
    elements.receiveQrBackLink.href,
    'https://missionode.github.io/lite/index.html',
  );
  assert.equal(elements.editPaymentLink.href, 'receive.html?Source=Lite');

  elements.editPaymentLink.listeners.click({preventDefault() {}});
  assert.equal(historyBackCalls, 1);
  assert.notEqual(localStorage.getItem('pending_receive_transaction'), null);

  elements.doneButton.listeners.click();
  const transactions = JSON.parse(localStorage.getItem('earn_transactions'));
  assert.equal(transactions.length, 1);
  assert.equal(localStorage.getItem('pending_receive_transaction'), null);
  assert.equal(location.href, 'index.html');
});
