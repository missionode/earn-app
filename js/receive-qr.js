document.addEventListener('DOMContentLoaded', () => {
    const LITE_RETURN_URL = 'https://missionode.github.io/lite/index.html';
    const urlParams = new URLSearchParams(window.location.search);
    const isLiteSource = (urlParams.get('Source') || '').toLowerCase() === 'lite';
    const returnUrl = isLiteSource ? LITE_RETURN_URL : 'index.html';

    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const amountDisplay = document.getElementById('amountDisplay');
    const descriptionDisplay = document.getElementById('descriptionDisplay');
    const payeeNameDisplay = document.getElementById('payeeNameDisplay');
    const doneButton = document.getElementById('doneButton');
    const cancelButton = document.getElementById('cancelButton');
    const receiveQrBackLink = document.getElementById('receiveQrBackLink');

    const payeeVPA = localStorage.getItem('earn_upiId');
    const payeeName = localStorage.getItem('earn_username');
    const pendingTransactionString = localStorage.getItem(
        'pending_receive_transaction',
    );
    const pendingTransaction = pendingTransactionString ?
        JSON.parse(pendingTransactionString) : null;

    receiveQrBackLink.href = returnUrl;

    if (!payeeVPA || !payeeName || !pendingTransaction) {
        alert('Error: Payment details not found.');
        window.location.href = returnUrl;
        return;
    }

    const {amount, description} = pendingTransaction;
    amountDisplay.textContent = `₹${amount.toFixed(2)}`;
    descriptionDisplay.textContent = description || 'No description provided';
    payeeNameDisplay.textContent = payeeName;

    let upiLink = `upi://pay?pa=${encodeURIComponent(payeeVPA)}` +
        `&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}`;
    if (description) {
        upiLink += `&tn=${encodeURIComponent(description)}`;
    }

    new QRCode(qrCodeContainer, {
        text: upiLink,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
        logo: 'assets/icons/icon-40x40.svg',
        logoWidth: 64,
        logoHeight: 64,
        logoBackgroundColor: '#ffffff',
        logoBackgroundTransparent: false,
    });

    const clearPendingTransaction = () => {
        localStorage.removeItem('pending_receive_transaction');
    };

    doneButton.addEventListener('click', () => {
        const transactions = JSON.parse(
            localStorage.getItem('earn_transactions') || '[]',
        );
        transactions.unshift(pendingTransaction);
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
        clearPendingTransaction();
        window.location.href = returnUrl;
    });

    cancelButton.addEventListener('click', () => {
        clearPendingTransaction();
        window.location.href = returnUrl;
    });

    receiveQrBackLink.addEventListener('click', clearPendingTransaction);
});
