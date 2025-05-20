document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const homePage = document.getElementById('homepage'); // Keep this as it's used for other logic
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
        const validDomains = [
            'ybl',          // Paytm
            'upi',          // General UPI
            'okhdfcbank',   // HDFC Bank
            'hdfcbank',     // HDFC Bank New
            'icici',        // ICICI Bank (direct)
            'axisbank',     // Axis Bank
            'oksbi',        // SBI
            'paytm',        // Paytm
            'fbl',          // Federal Bank
            'okicici',      // ICICI Bank (via Google Pay)
            'kotak',        // Kotak Mahindra Bank
            'yesbank',      // YES Bank
            'idbi',         // IDBI Bank
            'canarabank',   // Canara Bank
            'pnb',          // Punjab National Bank
            'airtel',       // Airtel Payments Bank
            'barodapay',    // Bank of Baroda
            'hsbc',         // HSBC Bank
            'rbl',          // RBL Bank
            'indus',        // IndusInd Bank
            'ubi',          // Union Bank of India
            'standardchartered', // Standard Chartered Bank
            'cbin',         // Central Bank of India
            'iob',          // Indian Overseas Bank
            'sib',          // South Indian Bank
            'tjsb',         // TJSB (Co-operative Bank)
            'kbl',          // Karnataka Bank
            'dbs',          // DBS Bank India
            'bandhan',      // Bandhan Bank
            'nsdl',         // NSDL Payments Bank
            'jio',          // Jio Payments Bank
            'lvbank',       // Laxmi Vilas Bank
            'punjabandsindh', // Punjab & Sind Bank
            'idfcfirst',    // IDFC First Bank
            'csb',          // Catholic Syrian Bank
            'citi',         // Citibank India
            'dlb',          // Dhanlaxmi Bank
            'kvbank',       // Karur Vysya Bank
            'jandkbank',    // Jammu and Kashmir Bank
            'equitas',      // Equitas Small Finance Bank
            'dcb',          // DCB Bank
            'aubank'        // AU Small Finance Bank
        ];
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
                <p><b><b>Filtered Income:</b></b> ₹${totalIncome.toFixed(2)}</p>
                <p><b><b>Filtered Expenses:</b></b> ₹${totalExpenses.toFixed(2)}</p>
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
        // Find the most recent pending transaction
        const latestPendingTransaction = transactions.find(t => t.status === 'pending');

        if (latestPendingTransaction && upiConfirmationNotification) {
            console.log("DEBUG (index.js): Found pending transaction. Displaying confirmation popup.");
            upiConfirmationTitle.textContent = 'Confirm Pending Payment';
            upiConfirmationAmount.textContent = `Amount: ₹${parseFloat(latestPendingTransaction.amount).toFixed(2)}`;
            upiConfirmationDescription.textContent = latestPendingTransaction.description || 'No description provided.';
            upiConfirmationNotification.classList.add('show'); // Add 'show' class for animation

            upiConfirmButton.onclick = () => {
                console.log("Confirm button clicked for transaction ID:", latestPendingTransaction.id);
                updateTransactionStatus(latestPendingTransaction.id, 'success');
                upiConfirmationNotification.classList.remove('show'); // Hide popup
                alert('Payment confirmed and added to your transactions!');
                // Clear pending_upi_confirmation from localStorage after user confirms
                localStorage.removeItem('pending_upi_confirmation');
            };

            upiConfirmCancelButton.onclick = () => {
                console.log("Cancel button clicked for transaction ID:", latestPendingTransaction.id);
                // Remove the pending transaction from the main list if cancelled
                let currentTransactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
                const filtered = currentTransactions.filter(t => t.id !== latestPendingTransaction.id);
                setLocalStorageItem('earn_transactions', JSON.stringify(filtered));

                upiConfirmationNotification.classList.remove('show'); // Hide popup
                alert('Payment confirmation cancelled. Transaction removed.');
                // Clear pending_upi_confirmation from localStorage after user cancels
                localStorage.removeItem('pending_upi_confirmation');
                loadTransactions(); // Reload to reflect removal
                updateOverallSummary();
            };
        } else if (upiConfirmationNotification) {
            console.log("DEBUG (index.js): No pending transaction found or upiConfirmationNotification is null. Ensuring popup is hidden.");
            upiConfirmationNotification.classList.remove('show'); // Ensure it's hidden if no pending transaction
            // Also clear any stale pending_upi_confirmation if no actual pending transaction exists in earn_transactions
            localStorage.removeItem('pending_upi_confirmation');
        } else {
            console.error("ERROR (index.js): upiConfirmationNotification element not found! Cannot display/hide popup.");
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
        console.log("DEBUG (index.js): Transactions reloaded and summary updated after status change.");
    };


    // --- Initialization ---
    // Log current URL and localStorage state immediately on DOMContentLoaded
    console.log("DEBUG (index.js): Page loaded. Current URL:", window.location.href);
    console.log("DEBUG (index.js): localStorage 'earn_transactions' on load:", localStorage.getItem('earn_transactions'));
    console.log("DEBUG (index.js): localStorage 'pending_upi_confirmation' on load:", localStorage.getItem('pending_upi_confirmation'));

    // Check if upiConfirmationNotification element is found right at the start
    const debugUpiConfNotification = document.getElementById('upiConfirmationNotification');
    if (debugUpiConfNotification) {
        console.log("DEBUG (index.js): upiConfirmationNotification element found on DOMContentLoaded:", debugUpiConfNotification);
    } else {
        console.error("ERROR (index.js): upiConfirmationNotification element NOT found on DOMContentLoaded!");
    }

    // Main application initialization based on user status
    if (isFirstTimeUser()) {
        console.log("DEBUG (index.js): User is first time user. Displaying UPI setup popup.");
        displayUPISetupPopup();
    } else {
        console.log("DEBUG (index.js): User is not first time user. Loading content normally.");
        loadTransactions();
        updateOverallSummary();
        setTimeout(triggerConfirmationPopup, 500); // Check for pending UPI transaction
    }


    // --- Event Listeners ---
    if (upiSetupForm) upiSetupForm.addEventListener('submit', handleUPISetupSubmit);
    if (receiveMoneyBtn) receiveMoneyBtn.addEventListener('click', () => window.location.href = 'receive.html');
    if (sendMoneyBtn) sendMoneyBtn.addEventListener('click', () => window.location.href = 'send.html');
    if (filterType) filterType.addEventListener('change', loadTransactions);
    if (categoryFilter) categoryFilter.addEventListener('change', loadTransactions);
    if (searchBox) searchBox.addEventListener('input', loadTransactions);
    if (startDateInput) startDateInput.addEventListener('change', loadTransactions);
    if (endDateInput) endDateInput.addEventListener('change', loadTransactions);
    if (clearFilterButton) {
        clearFilterButton.addEventListener('click', () => {
            if (filterType) filterType.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (searchBox) searchBox.value = '';
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            loadTransactions();
        });
    }

    // Logic for hiding transaction details using nth-child (from previous request)
    const hideDetailsState = localStorage.getItem('hideDetails');
    if (hideDetailsState === 'false') { // Check for 'false' string
        document.body.classList.add('hide-transaction-details');
    } else {
         document.body.classList.remove('hide-transaction-details'); // Ensure class is removed if state is true or not set
    }


    // Function to get the value of a specific query parameter from the URL
    function getQueryParam(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }

    // Check if the 'triggerUPIPopUp' parameter is present and true
    const triggerPopup = getQueryParam('triggerUPIPopUp');
    if (triggerPopup === 'true') {
      const upiSetupPopup = document.getElementById('upiSetupPopup');
      if (upiSetupPopup) {
        upiSetupPopup.style.display = 'block';
        // Optionally, you might want to remove the parameter from the URL
        // to prevent it from triggering the popup on subsequent reloads
        const url = new URL(window.location.href);
        url.searchParams.delete('triggerUPIPopUp');
        window.history.replaceState({}, document.title, url);
      } else {
        console.error('Error: #upiSetupPopup element not found in index.html.');
      }
    }

    // You'll also likely need a way to close the popup on index.html
    function closeUpiSetupPopup() {
        const upiSetupPopup = document.getElementById('upiSetupPopup');
        if (upiSetupPopup) {
            upiSetupPopup.style.display = 'none';
        }
    }

    // Attach the close function to a button within the popup (example):
    if (closeUpiSetupButton) {
      closeUpiSetupButton.addEventListener('click', closeUpiSetupPopup);
    }

    // Keep populateCategoryFilter call here as it depends on DOM being loaded
    populateCategoryFilter();

});
