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
    const amountErrorDisplay = document.getElementById('receiveAmountError'); // Get the error span
    // Get the switch and the details container for Receive page
    const toggleDetailsSwitchReceive = document.getElementById('toggleDetailsReceive');
    const detailsFieldsReceive = document.getElementById('detailsFieldsReceive');

    // --- Unified Switch Logic ---
    // Load the saved switch state from local storage (using a single key)
    const hideDetailsState = getLocalStorageItem('hideDetails');
    // Standard: 'true' means hide, 'false' means show. Default to HIDE if not set.
    // So, showDetails is true ONLY if hideDetailsState is explicitly 'false'.
    const showDetails = hideDetailsState === 'false'; 

    toggleDetailsSwitchReceive.checked = showDetails;
    detailsFieldsReceive.classList.toggle('hidden', !showDetails); // If showDetails is true, don't hide. If false, hide.

    // Event listener for the toggle switch
    toggleDetailsSwitchReceive.addEventListener('change', () => {
        // If switch is checked (details are shown), 'hideDetails' should be 'false'.
        // If switch is unchecked (details are hidden), 'hideDetails' should be 'true'.
        const hideDetailsValue = (!toggleDetailsSwitchReceive.checked).toString();
        detailsFieldsReceive.classList.toggle('hidden', !toggleDetailsSwitchReceive.checked);
        if (!setLocalStorageItem('hideDetails', hideDetailsValue)) {
            alert("Could not save your preference for showing/hiding details.");
        }
    });
    // --- End Unified Switch Logic ---


    receiveForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const amount = parseFloat(amountInput.value);
        // Only get category and description if details are shown
        const description = toggleDetailsSwitchReceive.checked ? descriptionInput.value : '';
        let category = '';
        if (toggleDetailsSwitchReceive.checked) {
            if (categoryCash.checked) category = 'cash';
            if (categoryRent.checked) category = 'rent';
            if (categorySalary.checked) category = 'salary';
            if (categoryOther.checked) category = 'other';
        }

        if (isNaN(amount) || amount <= 0) {
            if (amountErrorDisplay) {
                amountErrorDisplay.textContent = 'Please enter a valid positive amount.';
                amountErrorDisplay.style.display = 'block';
            } else {
                alert('Please enter a valid amount.'); // Fallback if span not found
            }
            return;
        } else if (amountErrorDisplay) {
            amountErrorDisplay.textContent = '';
            amountErrorDisplay.style.display = 'none';
        }

        const transactionData = {
            id: generateUniqueId(),
            type: 'income',
            amount: amount,
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            status: 'success' // Added status: 'success' for income transactions
        };

        // Store the transaction data temporarily in localStorage for QR code
        if (setLocalStorageItem('pending_receive_transaction', JSON.stringify(transactionData))) {
            window.location.href = 'receive-qr.html';
        } else {
            alert("Could not save pending transaction. Please try again.");
            // Prevent redirection by not executing window.location.href
        }
    });

    // Event listener for the "Add Custom Receipt" button
    customReceiptButton.addEventListener('click', () => {
        const amount = parseFloat(amountInput.value);
         // Only get category and description if details are shown
        const description = toggleDetailsSwitchReceive.checked ? descriptionInput.value : '';
        let category = '';
        if (toggleDetailsSwitchReceive.checked) {
            if (categoryCash.checked) category = 'cash';
            if (categoryRent.checked) category = 'rent';
            if (categorySalary.checked) category = 'salary';
            if (categoryOther.checked) category = 'other';
        }

        if (isNaN(amount) || amount <= 0) {
            if (amountErrorDisplay) {
                amountErrorDisplay.textContent = 'Please enter a valid positive amount.';
                amountErrorDisplay.style.display = 'block';
            } else {
                alert('Please enter a valid amount.'); // Fallback if span not found
            }
            return;
        } else if (amountErrorDisplay) {
            amountErrorDisplay.textContent = '';
            amountErrorDisplay.style.display = 'none';
        }

        const transactionData = {
            id: generateUniqueId(),
            type: 'income',
            amount: amount,
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            status: 'success' // Added status: 'success' for income transactions
        };

        // Save the transaction directly to earn_transactions
        if (saveTransaction(transactionData)) {
            window.location.href = 'index.html'; // Redirect to index.html
        } else {
            // Alert is handled by saveTransaction, so just prevent redirection.
        }
    });

    function saveTransaction(transaction) {
        let transactions = getParsedLocalStorageItem('earn_transactions', []);
        transactions.unshift(transaction); // Add to the beginning for recent first
        if (!setLocalStorageItem('earn_transactions', JSON.stringify(transactions))) {
            alert("Failed to save transaction to the main list. Please try again.");
            return false;
        }
        return true;
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
