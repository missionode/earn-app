document.addEventListener('DOMContentLoaded', () => {
    const upiSetupPopup = document.getElementById('upiSetupPopup');
    const upiSetupForm = document.getElementById('upiSetupForm');
    const upiIdInput = document.getElementById('upiId');
    const usernameInput = document.getElementById('username');
    const upiIdError = document.getElementById('upiIdError');
    const usernameError = document.getElementById('usernameError');
    const receiveMoneyBtn = document.getElementById('receiveMoneyBtn');
    const sendMoneyBtn = document.getElementById('sendMoneyBtn');
    const totalIncomeDisplay = document.getElementById('totalIncome');
    const totalExpensesDisplay = document.getElementById('totalExpenses');
    const transactionsTableBody = document.getElementById('transactionsTable').querySelector('tbody');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchBox = document.getElementById('searchBox');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterType = document.getElementById('filterType');
    const clearFilterButton = document.getElementById('clearFilter');
    const filteredSummaryContainer = document.getElementById('filteredSummaryContainer');
    const upiConfirmationNotification = document.getElementById('upiConfirmationNotification');
    const upiConfirmationTitle = document.getElementById('upiConfirmationTitle');
    const upiConfirmationAmount = document.getElementById('upiConfirmationAmount');
    const upiConfirmationDescription = document.getElementById('upiConfirmationDescription');
    const upiConfirmCancelButton = document.getElementById('upiConfirmCancelButton');
    const upiConfirmButton = document.getElementById('upiConfirmButton');

    let allTransactions = [];

    // --- Helper Functions ---
    const getLocalStorageItem = (key) => localStorage.getItem(key);
    const setLocalStorageItem = (key, value) => localStorage.setItem(key, value);
    const isFirstTimeUser = () => !getLocalStorageItem('earn_upiId') || !getLocalStorageItem('earn_username');
    const displayUPISetupPopup = () => upiSetupPopup.style.display = 'block';
    const hideUPISetupPopup = () => upiSetupPopup.style.display = 'none';

    const validateUPIId = (upiId) => {
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,}@[a-zA-Z]{2,}$/.test(upiId)) return 'Invalid UPI ID format.';
        const domain = upiId.split('@')[1];
        const validDomains = ['ybl', 'upi', 'okhdfcbank', 'icici', 'axisbank', 'oksbi', 'paytm', 'fbl', 'okicici'];
        return validDomains.includes(domain) ? '' : 'Invalid UPI ID domain.';
    };

    const getCategoryIcon = (category) => ({
        'cash': 'assets/icons/cash.svg',
        'rent': 'assets/icons/rent.svg',
        'salary': 'assets/icons/salary.svg',
        'gift': 'assets/icons/gift.svg',
        'investment': 'assets/icons/investment.svg',
        'other': 'assets/icons/other.svg',
        'food': 'assets/icons/food.svg',
        'shopping': 'assets/icons/shopping-bag.svg',
        'entertainment': 'assets/icons/entertainment.svg',
        'travel': 'assets/icons/travel.svg',
        'others': 'assets/icons/others.svg',
    })[category] || '';

    const filterTransactions = (transactions, filters) => {
        let filteredTransactions = [...transactions];

        if (filters.type) {
            filteredTransactions = filteredTransactions.filter(t => t.type === filters.type);
        }

        if (filters.category) {
            filteredTransactions = filteredTransactions.filter(t => t.category === filters.category);
        }

        if (filters.startDate && filters.endDate) {
            filteredTransactions = filteredTransactions.filter(t => t.date >= filters.startDate && t.date <= filters.endDate);
        } else if (filters.startDate) {
            filteredTransactions = filteredTransactions.filter(t => t.date >= filters.startDate);
        } else if (filters.endDate) {
            filteredTransactions = filteredTransactions.filter(t => t.date <= filters.endDate);
        }

        if (filters.search) {
            filteredTransactions = filteredTransactions.filter(t => t.description && t.description.toLowerCase().includes(filters.search));
        }

        return filteredTransactions;
    };

    const loadTransactions = () => {
        console.log("loadTransactions called");
        const storedTransactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        allTransactions = storedTransactions.filter(t => t.status !== 'pending');
        console.log("Transactions loaded (excluding pending):", allTransactions);
        const filters = {
            type: filterType.value,
            category: categoryFilter.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            search: searchBox.value ? searchBox.value.toLowerCase() : ''
        };
        const displayedTransactions = filterTransactions(allTransactions, filters).slice(0, 50);
        transactionsTableBody.innerHTML = '';
        displayedTransactions.forEach(transaction => {
            const row = transactionsTableBody.insertRow();
            const typeCell = row.insertCell();
            const categoryCell = row.insertCell();
            const descriptionCell = row.insertCell();
            const amountCell = row.insertCell();
            const dateCell = row.insertCell();
            const timeCell = row.insertCell();
            const statusCell = row.insertCell();

            if (transaction.type === 'expense') {
                typeCell.innerHTML = '<img src="assets/icons/arrow-up-expense.svg" alt="Expense" class="transaction-icon">';
            } else if (transaction.type === 'income') {
                typeCell.innerHTML = '<img src="assets/icons/arrow-down-income.svg" alt="Income" class="transaction-icon">';
            } else {
                typeCell.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1); // Fallback
            }

            const icon = getCategoryIcon(transaction.category) || 'assets/icons/default.svg';
            categoryCell.innerHTML = `<img src="${icon}" alt="${transaction.category}">`;
            descriptionCell.textContent = transaction.description || '-';
            const formattedAmount = `₹${parseFloat(transaction.amount).toFixed(2)}`;
            amountCell.textContent = transaction.type === 'expense' ? `- ${formattedAmount}` : `+ ${formattedAmount}`;
            amountCell.classList.add(transaction.type === 'expense' ? 'expense' : 'income');
            dateCell.textContent = transaction.date;
            timeCell.textContent = transaction.time;
            statusCell.textContent = transaction.status || '';
        });
        updateFilteredSummary(displayedTransactions, filters);
        updateCategoryFilterByType(filterType.value);
    };

    const updateFilteredSummary = (transactions, filters) => {
        let totalIncome = 0;
        let totalExpenses = 0;
        let isFilterActive = Object.values(filters).some(value => value && value !== '');

        if (isFilterActive && filteredSummaryContainer) {
            transactions.forEach(t => {
                if (t.type === 'income') {
                    totalIncome += parseFloat(t.amount);
                } else if (t.type === 'expense') {
                    totalExpenses += parseFloat(t.amount);
                }
            });
            filteredSummaryContainer.innerHTML = `
                <p><b>Filtered Income:</b> ₹${totalIncome.toFixed(2)}</p>
                <p><b>Filtered Expenses:</b> ₹${totalExpenses.toFixed(2)}</p>
            `;
            filteredSummaryContainer.style.display = 'block';
        } else if (filteredSummaryContainer) {
            filteredSummaryContainer.style.display = 'none';
            filteredSummaryContainer.innerHTML = '';
        }
    };

    const updateOverallSummary = () => {
        const transactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += parseFloat(t.amount);
            } else if (t.type === 'expense') {
                totalExpenses += parseFloat(t.amount);
            }
        });

        totalIncomeDisplay.textContent = `₹${totalIncome.toFixed(2)}`;
        totalExpensesDisplay.textContent = `₹${totalExpenses.toFixed(2)}`;
    };

    const handleUPISetupSubmit = (event) => {
        event.preventDefault();
        const upiId = upiIdInput.value.trim();
        const username = usernameInput.value.trim();

        const upiIdErrorMessage = validateUPIId(upiId);
        upiIdError.textContent = upiIdErrorMessage;
        usernameError.textContent = username ? '' : 'Please enter your name.';

        if (!upiIdErrorMessage && username) {
            setLocalStorageItem('earn_upiId', upiId);
            setLocalStorageItem('earn_username', username);
            hideUPISetupPopup();
            loadTransactions();
            updateOverallSummary();
        }
    };

    const updateCategoryFilterByType = (selectedType) => {
        const categoryOptions = categoryFilter.options;
        for (let i = 1; i < categoryOptions.length; i++) {
            const option = categoryOptions[i];
            const expenseCategories = ['food', 'shopping', 'entertainment', 'travel', 'others'];
            const incomeCategories = ['salary', 'gift', 'investment', 'cash', 'other'];

            if (selectedType === 'income') {
                option.style.display = incomeCategories.includes(option.value) ? 'block' : 'none';
            } else if (selectedType === 'expense') {
                option.style.display = expenseCategories.includes(option.value) ? 'block' : 'none';
            } else {
                option.style.display = 'block';
            }
        }
        categoryFilter.value = '';
    };

    const populateCategoryFilter = () => {
        const categories = ['food', 'shopping', 'entertainment', 'travel', 'others', 'salary', 'gift', 'investment', 'cash', 'other'];
        const categorySelect = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categorySelect.appendChild(option);
        });
    };

    const triggerConfirmationPopup = () => {
        const transactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        if (transactions.length > 0 && transactions[0].status === 'pending') {
            const latestPendingTransaction = transactions[0];
            upiConfirmationTitle.textContent = 'Confirm Pending Payment';
            upiConfirmationAmount.textContent = `Amount: ₹${parseFloat(latestPendingTransaction.amount).toFixed(2)}`;
            upiConfirmationDescription.textContent = latestPendingTransaction.description || 'No description provided.';
            upiConfirmationNotification.classList.add('show');

            upiConfirmButton.onclick = () => {
                console.log("Confirm button clicked for transaction ID:", latestPendingTransaction.id);
                updateTransactionStatus(latestPendingTransaction.id, 'success');
                upiConfirmationNotification.classList.remove('show');
            };

            upiConfirmCancelButton.onclick = () => {
                upiConfirmationNotification.classList.remove('show');
                alert('Payment confirmation cancelled.');
                // DO NOT call updateTransactionStatus here
            };
        } else {
            upiConfirmationNotification.classList.remove('show'); // Ensure it's hidden if no pending transaction
        }
    };

    const updateTransactionStatus = (transactionId, newStatus) => {
        console.log("updateTransactionStatus called with ID:", transactionId, "and status:", newStatus);
        const transactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        const updatedTransactions = transactions.map(t =>
            t.id === transactionId ? { ...t, status: newStatus } : t
        );
        setLocalStorageItem('earn_transactions', JSON.stringify(updatedTransactions));
        loadTransactions(); // Reload to show updated status
        updateOverallSummary();
    };

    // --- Initialization ---
    if (isFirstTimeUser()) {
        displayUPISetupPopup();
    } else {
        loadTransactions();
        updateOverallSummary();
        // Check for and trigger confirmation popup on load
        setTimeout(triggerConfirmationPopup, 500); // Slight delay to ensure table is loaded
    }

    populateCategoryFilter();

    // --- Event Listeners ---
    upiSetupForm.addEventListener('submit', handleUPISetupSubmit);
    receiveMoneyBtn.addEventListener('click', () => window.location.href = 'receive.html');
    sendMoneyBtn.addEventListener('click', () => window.location.href = 'send.html');
    filterType.addEventListener('change', loadTransactions);
    categoryFilter.addEventListener('change', loadTransactions);
    searchBox.addEventListener('input', loadTransactions);
    startDateInput.addEventListener('change', loadTransactions);
    endDateInput.addEventListener('change', loadTransactions);
    clearFilterButton.addEventListener('click', () => {
        filterType.value = '';
        categoryFilter.value = '';
        searchBox.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        loadTransactions();
    });

    // (Optional) Handle callback URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    const returnedTransactionId = urlParams.get('transactionId');

    if (paymentStatus === 'success' && returnedTransactionId) {
        // Find the 'pending' transaction with the matching transactionId and update its status to 'success'
        const transactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        const transactionToUpdate = transactions.find(t => t.id === returnedTransactionId && t.type === 'expense' && t.status === 'pending');
        if (transactionToUpdate) {
            transactionToUpdate.status = 'success';
            localStorage.setItem('earn_transactions', JSON.stringify(transactions));
            alert(`Payment successful for Transaction ID: ${returnedTransactionId}`);
            // Optionally update the transactions table immediately
            loadTransactions();
        }
        // Clear the status and transactionId parameters from the URL
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
    }
});