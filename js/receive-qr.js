document.addEventListener('DOMContentLoaded', () => {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const amountDisplay = document.getElementById('amountDisplay');
    const descriptionDisplay = document.getElementById('descriptionDisplay');
    const payeeNameDisplay = document.getElementById('payeeNameDisplay');
    const doneButton = document.getElementById('doneButton');

    const payeeVPA = getLocalStorageItem('earn_upiId');
    const payeeName = getLocalStorageItem('earn_username');
    const pendingTransaction = getParsedLocalStorageItem('pending_receive_transaction', null);

    // Validate User Details (UPI ID and Name)
    if (!payeeVPA || payeeVPA.trim() === '' || !payeeName || payeeName.trim() === '') {
        alert("Your UPI ID or Name is not set up correctly. Please return to the main page to set them up.");
        window.location.href = 'index.html';
        return; // Stop execution
    }

    // Validate Pending Transaction
    if (!pendingTransaction) {
        alert('Error: Payment details not found for QR generation.');
        window.location.href = 'index.html'; // Redirect to home if transaction data is missing
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
        logoWidth: 64, // Adjust logo width (optional)
        logoHeight: 64, // Adjust logo height (optional)
        logoBackgroundColor: '#ffffff', // Background color behind the logo (optional)
        logoBackgroundTransparent: false // Make the logo background transparent (optional)
    });

    doneButton.addEventListener('click', () => {
        if (saveTransaction(pendingTransaction)) {
            localStorage.removeItem('pending_receive_transaction'); // Clear the pending transaction
            window.location.href = 'index.html';
        } else {
            // Alert is handled by saveTransaction, so just prevent further actions.
        }
    });

    function saveTransaction(transaction) {
        let transactions = getParsedLocalStorageItem('earn_transactions', []);
        transactions.unshift(transaction); // Add to the beginning for recent first
        if (!setLocalStorageItem('earn_transactions', JSON.stringify(transactions))) {
            alert("Failed to save confirmed transaction. Please try again or note down the details.");
            return false;
        }
        return true;
    }
});