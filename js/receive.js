document.addEventListener('DOMContentLoaded', () => {
    const LITE_RETURN_URL = 'https://missionode.github.io/lite/index.html';
    const LITE_DESCRIPTION = 'Dakshina recieved for meditation';
    const urlParams = new URLSearchParams(window.location.search);
    const isLiteSource = (urlParams.get('Source') || '').toLowerCase() === 'lite';

    const receiveForm = document.getElementById('receiveForm');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const clientsInput = document.getElementById('clients');
    const clientsGroup = document.getElementById('clientsGroup');
    const categorySadhana = document.getElementById('categorySadhana');
    const categorySadhanaLabel = document.querySelector('.lite-only-category');
    const customReceiptButton = document.getElementById('customReceiptButton');
    const toggleDetailsSwitchReceive = document.getElementById('toggleDetailsReceive');
    const detailsToggleReceive = document.getElementById('detailsToggleReceive');
    const detailsFieldsReceive = document.getElementById('detailsFieldsReceive');
    const liteAmountHelp = document.getElementById('liteAmountHelp');
    const receiveBackLink = document.getElementById('receiveBackLink');
    const serviceCharge = parseFloat(localStorage.getItem('earn_serviceCharge'));
    const pendingTransactionString = localStorage.getItem(
        'pending_receive_transaction',
    );
    const pendingTransaction = pendingTransactionString ?
        JSON.parse(pendingTransactionString) : null;

    if (isLiteSource && (!Number.isFinite(serviceCharge) || serviceCharge <= 0)) {
        const returnTo = encodeURIComponent('receive.html?Source=Lite');
        window.location.replace(
            `index.html?triggerUPIPopUp=true&returnTo=${returnTo}`,
        );
        return;
    }

    const updateLiteAmount = () => {
        const clients = Number.parseInt(clientsInput.value, 10);
        if (!Number.isInteger(clients) || clients < 1) {
            amountInput.value = '';
            return;
        }
        amountInput.value = (serviceCharge * clients).toFixed(2);
    };

    if (isLiteSource) {
        detailsToggleReceive.hidden = true;
        toggleDetailsSwitchReceive.checked = true;
        detailsFieldsReceive.classList.remove('hidden');
        categorySadhana.hidden = false;
        categorySadhanaLabel.hidden = false;
        categorySadhana.checked = true;
        descriptionInput.value = LITE_DESCRIPTION;
        clientsGroup.hidden = false;
        liteAmountHelp.hidden = false;
        amountInput.readOnly = true;
        receiveBackLink.href = LITE_RETURN_URL;
        if (pendingTransaction && pendingTransaction.source === 'Lite') {
            clientsInput.value = pendingTransaction.clients || 1;
            descriptionInput.value = pendingTransaction.description ||
                LITE_DESCRIPTION;
        }
        updateLiteAmount();
        clientsInput.addEventListener('input', updateLiteAmount);
    } else {
        const hideDetailsState = localStorage.getItem('hideDetails');
        const showDetails = hideDetailsState === null ?
            true : hideDetailsState === 'true';

        toggleDetailsSwitchReceive.checked = showDetails;
        detailsFieldsReceive.classList.toggle('hidden', !showDetails);
        toggleDetailsSwitchReceive.addEventListener('change', () => {
            const currentState = toggleDetailsSwitchReceive.checked;
            detailsFieldsReceive.classList.toggle('hidden', !currentState);
            localStorage.setItem('hideDetails', currentState);
        });
    }

    setTimeout(() => {
        const input = isLiteSource ? clientsInput : amountInput;
        input.focus();
        input.select();
    }, 300);

    const createTransaction = () => {
        const amount = parseFloat(amountInput.value);
        const detailsAreVisible = toggleDetailsSwitchReceive.checked;
        const description = detailsAreVisible ? descriptionInput.value.trim() : '';
        const selectedCategory = detailsAreVisible ?
            document.querySelector('input[name="category"]:checked') : null;
        const category = selectedCategory ? selectedCategory.value : '';
        const clients = Number.parseInt(clientsInput.value, 10);

        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return null;
        }
        if (isLiteSource && (!Number.isInteger(clients) || clients < 1)) {
            alert('Please enter at least one client.');
            return null;
        }

        const transaction = {
            id: generateUniqueId(),
            type: 'income',
            amount,
            category,
            description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            status: 'success',
        };

        if (isLiteSource) {
            transaction.source = 'Lite';
            transaction.clients = clients;
            transaction.serviceCharge = serviceCharge;
        }

        return transaction;
    };

    receiveForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const transaction = createTransaction();
        if (!transaction) return;

        localStorage.setItem(
            'pending_receive_transaction',
            JSON.stringify(transaction),
        );
        window.location.href = isLiteSource ?
            'receive-qr.html?Source=Lite' : 'receive-qr.html';
    });

    customReceiptButton.addEventListener('click', () => {
        const transaction = createTransaction();
        if (!transaction) return;

        const transactions = JSON.parse(
            localStorage.getItem('earn_transactions') || '[]',
        );
        transactions.unshift(transaction);
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
        window.location.href = isLiteSource ? LITE_RETURN_URL : 'index.html';
    });

    const iconGrid = document.querySelector('.icon-grid');
    if (iconGrid) {
        iconGrid.addEventListener('click', (event) => {
            const label = event.target.closest('label');
            if (!label) return;

            const radioButton = document.getElementById(label.getAttribute('for'));
            if (radioButton) radioButton.checked = true;
        });
    }
});

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}
