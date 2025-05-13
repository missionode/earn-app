document.addEventListener('DOMContentLoaded', () => {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const amountDisplay = document.getElementById('amountDisplay');
    const descriptionDisplay = document.getElementById('descriptionDisplay');
    const payeeNameDisplay = document.getElementById('payeeNameDisplay');
    const doneButton = document.getElementById('doneButton');

    const payeeVPA = localStorage.getItem('earn_upiId');
    const payeeName = localStorage.getItem('earn_username');
    const pendingTransactionString = localStorage.getItem('pending_receive_transaction');
    const pendingTransaction = pendingTransactionString ? JSON.parse(pendingTransactionString) : null;

    if (!payeeVPA || !payeeName || !pendingTransaction) {
        alert('Error: Payment details not found.');
        window.location.href = 'index.html'; // Redirect to home if data is missing
        return;
    }

    const { amount, description } = pendingTransaction;

    amountDisplay.textContent = `₹${amount.toFixed(2)}`;
    descriptionDisplay.textContent = description || 'No description provided';
    payeeNameDisplay.textContent = payeeName;

    // Construct the UPI link (more robust format)
    let upiLink = `upi://pay?pa=${encodeURIComponent(payeeVPA)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}`;
    if (description) {
        upiLink += `&tn=${encodeURIComponent(description)}`; // 'tn' for transaction note/remarks
    }

    // Generate the QR code using EasyQRCodeJS with logo options
    new QRCode(qrCodeContainer, {
        text: upiLink,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H,
        logo: 'assets/icons/icon-40x40.svg', // Path to your logo image
        logoWidth: 50, // Adjust logo width (optional)
        logoHeight: 50, // Adjust logo height (optional)
        logoBackgroundColor: '#ffffff', // Background color behind the logo (optional)
        logoBackgroundTransparent: false // Make the logo background transparent (optional)
    });

    doneButton.addEventListener('click', () => {
        saveTransaction(pendingTransaction); // Save the pending transaction
        localStorage.removeItem('pending_receive_transaction'); // Clear the pending transaction
        window.location.href = 'index.html';
    });

    function saveTransaction(transaction) {
        let transactions = JSON.parse(localStorage.getItem('earn_transactions') || '[]');
        transactions.unshift(transaction); // Add to the beginning for recent first
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
    }
});