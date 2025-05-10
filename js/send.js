document.addEventListener('DOMContentLoaded', () => {
    const sendForm = document.getElementById('sendForm');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categoryFood = document.getElementById('categoryFood');
    const categoryShopping = document.getElementById('categoryShopping');
    const categoryEntertainment = document.getElementById('categoryEntertainment');
    const categoryTravel = document.getElementById('categoryTravel');
    const categoryOthers = document.getElementById('categoryOthers');

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
        // Redirect or open UPI app (implementation will depend on platform)
        alert('Initiating UPI payment (implementation pending)');
        // For now, redirect back to home
        const upiIntentUrl = `upi://pay?pa=<span class="math-inline">\{encodeURIComponent\(recipientVPA\)\}&pn\=</span>{encodeURIComponent('Recipient Name')}&am=<span class="math-inline">\{amount\.toFixed\(2\)\}&cu\=INR&tr\=</span>{encodeURIComponent(transactionId)}&tn=${encodeURIComponent(description)}`;
        window.location.href = 'upi://pay';
    });

    function saveTransaction(transaction) {
        let transactions = JSON.parse(localStorage.getItem('earn_transactions') || '[]');
        transactions.unshift(transaction); // Add to the beginning for recent first
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
    }
    
     // **Crucially, you need the recipient's VPA here.**
     const recipientVPA = 'recipientupi@examplebank'; // Replace with actual recipient VPA

     const transactionId = generateUniqueId(); // Generate a unique transaction ID

     const upiIntentUrl = `upi://pay?pa=<span class="math-inline">\{encodeURIComponent\(recipientVPA\)\}&pn\=</span>{encodeURIComponent('Recipient Name')}&am=<span class="math-inline">\{amount\.toFixed\(2\)\}&cu\=INR&tr\=</span>{encodeURIComponent(transactionId)}&tn=${encodeURIComponent(description)}`;

     // Try to open the UPI app
     window.location.href = upiIntentUrl;
});