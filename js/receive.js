document.addEventListener('DOMContentLoaded', () => {

  setTimeout(() => {
    const input = document.getElementById("amount");
    input.focus();
    input.select(); // optional
  }, 300); // delay ensures mobile keyboard show
    
    const receiveForm = document.getElementById('receiveForm');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categoryCash = document.getElementById('categoryCash');
    const categoryRent = document.getElementById('categoryRent');
    const categorySalary = document.getElementById('categorySalary');
    const categoryOther = document.getElementById('categoryOther');
    const customReceiptButton = document.getElementById('customReceiptButton'); // Get the custom receipt button

    receiveForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value;
        let category = '';

        if (categoryCash.checked) category = 'cash';
        if (categoryRent.checked) category = 'rent';
        if (categorySalary.checked) category = 'salary';
        if (categoryOther.checked) category = 'other';

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const transactionData = {
            id: generateUniqueId(),
            type: 'income',
            amount: amount,
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0]
        };

        // Store the transaction data temporarily in localStorage for QR code
        localStorage.setItem('pending_receive_transaction', JSON.stringify(transactionData));
        window.location.href = 'receive-qr.html';
    });

    // Event listener for the "Add Custom Receipt" button
    customReceiptButton.addEventListener('click', () => {
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value;
        let category = '';

        if (categoryCash.checked) category = 'cash';
        if (categoryRent.checked) category = 'rent';
        if (categorySalary.checked) category = 'salary';
        if (categoryOther.checked) category = 'other';

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const transactionData = {
            id: generateUniqueId(),
            type: 'income',
            amount: amount,
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0]
        };

        // Save the transaction directly to earn_transactions
        saveTransaction(transactionData);
        window.location.href = 'index.html'; // Redirect to index.html
    });

    function saveTransaction(transaction) {
        let transactions = JSON.parse(localStorage.getItem('earn_transactions') || '[]');
        transactions.unshift(transaction); // Add to the beginning for recent first
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
    }

    const iconGrid = document.querySelector('.icon-grid');

    if (iconGrid) {
        iconGrid.addEventListener('click', (event) => {
            const label = event.target.closest('label');
            if (label) {
                const radioId = label.getAttribute('for');
                if (radioId) {
                    const radioButton = document.getElementById(radioId);
                    if (radioButton) {
                        radioButton.checked = true;
                    }
                }
            }
        });
    }
});

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}
