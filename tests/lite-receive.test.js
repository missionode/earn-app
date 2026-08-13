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

const runReceivePage = (storageEntries = {}) => {
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
    search: '?Source=Lite',
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
  const context = {
    alert() {},
    console,
    document,
    localStorage,
    setTimeout(handler) {
      handler();
    },
    URLSearchParams,
    window: {location},
  };

  vm.runInNewContext(fs.readFileSync('js/receive.js', 'utf8'), context);
  readyHandler();
  return {elements, localStorage, location, sadhanaLabel};
};

test('Lite receive prefills and recalculates the collection', () => {
  const page = runReceivePage({earn_serviceCharge: '500'});

  assert.equal(page.elements.description.value, 'Dakshina recieved for meditation');
  assert.equal(page.elements.categorySadhana.checked, true);
  assert.equal(page.elements.amount.value, '500.00');
  assert.equal(page.elements.amount.readOnly, true);
  assert.equal(page.elements.clientsGroup.hidden, false);
  assert.equal(page.elements.detailsToggleReceive.hidden, true);
  assert.equal(
    page.elements.receiveBackLink.href,
    'https://missionode.github.io/lite/index.html',
  );

  page.elements.clients.value = '3';
  page.elements.clients.listeners.input();
  assert.equal(page.elements.amount.value, '1500.00');

  page.elements.receiveForm.listeners.submit({preventDefault() {}});
  const pending = JSON.parse(
    page.localStorage.getItem('pending_receive_transaction'),
  );
  assert.equal(pending.amount, 1500);
  assert.equal(pending.category, 'sadhana');
  assert.equal(pending.clients, 3);
  assert.equal(pending.serviceCharge, 500);
  assert.equal(pending.source, 'Lite');
  assert.equal(page.location.href, 'receive-qr.html?Source=Lite');
});

test('Lite receive routes missing service charge through setup', () => {
  const page = runReceivePage();
  assert.equal(
    page.location.replacedWith,
    'index.html?triggerUPIPopUp=true&returnTo=' +
      'receive.html%3FSource%3DLite',
  );
});

test('Lite custom receipt saves locally and returns to Lite', () => {
  const page = runReceivePage({earn_serviceCharge: '250'});
  page.elements.customReceiptButton.listeners.click();

  const transactions = JSON.parse(
    page.localStorage.getItem('earn_transactions'),
  );
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].amount, 250);
  assert.equal(
    page.location.href,
    'https://missionode.github.io/lite/index.html',
  );
});

test('Lite QR completion saves and returns to Lite', () => {
  const ids = [
    'qrCodeContainer',
    'amountDisplay',
    'descriptionDisplay',
    'payeeNameDisplay',
    'doneButton',
    'cancelButton',
    'receiveQrBackLink',
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
  let qrOptions;
  function QRCode(container, options) {
    qrOptions = options;
  }
  QRCode.CorrectLevel = {H: 'H'};
  const context = {
    alert() {},
    console,
    document,
    localStorage,
    QRCode,
    URLSearchParams,
    window: {location},
  };

  vm.runInNewContext(fs.readFileSync('js/receive-qr.js', 'utf8'), context);
  readyHandler();

  assert.match(qrOptions.text, /am=500\.00/);
  assert.match(qrOptions.text, /Dakshina%20recieved%20for%20meditation/);
  assert.equal(
    elements.receiveQrBackLink.href,
    'https://missionode.github.io/lite/index.html',
  );

  elements.doneButton.listeners.click();
  const transactions = JSON.parse(localStorage.getItem('earn_transactions'));
  assert.equal(transactions.length, 1);
  assert.equal(localStorage.getItem('pending_receive_transaction'), null);
  assert.equal(location.href, 'https://missionode.github.io/lite/index.html');
});
