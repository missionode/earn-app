document.addEventListener('DOMContentLoaded', () => {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const amountDisplay = document.getElementById('amountDisplay');
    const descriptionDisplay = document.getElementById('descriptionDisplay');
    const payeeNameDisplay = document.getElementById('payeeNameDisplay');
    const doneButton = document.getElementById('doneButton');

    const payeeVPA = localStorage.getItem('earn_upiId');
    const payeeName = localStorage.getItem('earn_username');
    const transactionsString = localStorage.getItem('earn_transactions');
    const transactions = transactionsString ? JSON.parse(transactionsString) : [];

    if (!payeeVPA || !payeeName || transactions.length === 0) {
        alert('Error: Payment details not found.');
        window.location.href = 'index.html'; // Redirect to home if data is missing
        return;
    }

    // Get the most recent transaction (assuming the last one added was for receiving)
    const latestTransaction = transactions[0];
    const { amount, description } = latestTransaction;

    amountDisplay.textContent = `₹${amount.toFixed(2)}`;
    descriptionDisplay.textContent = description || 'No description provided';
    payeeNameDisplay.textContent = payeeName;

    // Construct the UPI link (basic format - might need adjustments)
    const upiLink = `upi://pay?pa=${encodeURIComponent(payeeVPA)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}`;

    // Generate the QR code using EasyQRCodeJS
    new QRCode(qrCodeContainer, {
        text: upiLink,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
        // You can add logo options here if you have a logo image
    });

    doneButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});