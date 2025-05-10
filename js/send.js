document.addEventListener('DOMContentLoaded', () => {
    const sendForm = document.getElementById('sendForm');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categoryFood = document.getElementById('categoryFood');
    const categoryShopping = document.getElementById('categoryShopping');
    const categoryEntertainment = document.getElementById('categoryEntertainment');
    const categoryTravel = document.getElementById('categoryTravel');
    const categoryOthers = document.getElementById('categoryOthers');

    // **Move generateUniqueId() outside the submit listener**
    function generateUniqueId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    sendForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value;
        let category = '';

        if (categoryFood.checked) category = 'food';
        if (categoryShopping.checked) category = 'shopping';
        if (categoryEntertainment.checked) category = 'entertainment';
        if (categoryTravel.checked) category = 'travel';
        if (categoryOthers.checked) category = 'others';

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const transactionData = {
            type: 'expense',
            amount: amount,
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0]
        };

        console.log('Expense Data:', transactionData);
        saveTransaction(transactionData); // Save the transaction

        // **Crucially, you need the recipient's VPA here.**
        const recipientVPA = 'nath.syam.1986@okicici'; // Replace with actual recipient VPA

        const transactionId = generateUniqueId(); // Now this will work

        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(recipientVPA)}&pn=${encodeURIComponent('Recipient Name')}&am=${amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(transactionId)}&tn=${encodeURIComponent(description)}`;

        // Try to open the UPI app
        window.location.href = upiIntentUrl;
    });

    function saveTransaction(transaction) {
        let transactions = JSON.parse(localStorage.getItem('earn_transactions') || '[]');
        transactions.unshift(transaction); // Add to the beginning for recent first
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
    }
});