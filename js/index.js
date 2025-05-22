document.addEventListener('DOMContentLoaded', () => {
    // --- Version Log ---
    console.log("DEBUG: index.js version: Truly Unified DOMContentLoaded (2025-05-21) - Enhanced Debugging");

    // --- Variables (Declared only once at the top of the single DOMContentLoaded block) ---
    const homePage = document.getElementById('homepage');
    // Subscription related elements (now removed from HTML, but keeping variables for safety if HTML is older)
    const subscriptionNotification = document.getElementById('subscriptionNotification');
    const skipNotificationButton = document.getElementById('skipNotification');
    const manualConfirmationPopup = document.getElementById('manualConfirmationPopup');
    const confirmPaidButton = document.getElementById('confirmPaidButton');
    const confirmNotPaidButton = document.getElementById('confirmNotPaidButton');

    // UPI Setup Popup elements
    const upiSetupPopup = document.getElementById('upiSetupPopup');
    const upiSetupForm = document.getElementById('upiSetupForm');
    const upiIdInput = document.getElementById('upiId');
    const usernameInput = document.getElementById('username');
    const upiIdError = document.getElementById('upiIdError');
    const usernameError = document.getElementById('usernameError');
    const closeUpiSetupButton = document.getElementById('closeUpiSetup'); // Declared once here!

    // Main action buttons
    const receiveMoneyBtn = document.getElementById('receiveMoneyBtn');
    const sendMoneyBtn = document.getElementById('sendMoneyBtn');

    // Summary displays
    const totalIncomeDisplay = document.getElementById('totalIncome');
    const totalExpensesDisplay = document.getElementById('totalExpenses');

    // Transactions table and filters
    const transactionsTableBody = document.getElementById('transactionsTable') ? document.getElementById('transactionsTable').querySelector('tbody') : null;
    const categoryFilter = document.getElementById('categoryFilter');
    const searchBox = document.getElementById('searchBox');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterType = document.getElementById('filterType');
    const clearFilterButton = document.getElementById('clearFilter');
    const filteredSummaryContainer = document.getElementById('filteredSummaryContainer');

    // Elements for the UPI payment confirmation modal (from send.html redirect)
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
    const displayUPISetupPopup = () => {
        if (upiSetupPopup) upiSetupPopup.style.display = 'block';
        else console.error("ERROR: upiSetupPopup element not found for displayUPISetupPopup.");
    };
    const hideUPISetupPopup = () => {
        if (upiSetupPopup) upiSetupPopup.style.display = 'none';
        else console.error("ERROR: upiSetupPopup element not found for hideUPISetupPopup.");
    };

    const validateUPIId = (upiId) => {
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,}@[a-zA-Z]{2,}$/.test(upiId)) return 'Invalid UPI ID format.';
        const domain = upiId.split('@')[1];
        const validDomains = [
            'ybl', 'upi', 'okhdfcbank', 'hdfcbank', 'icici', 'axisbank', 'oksbi', 'paytm', 'fbl', 'okicici', 'kotak', 'yesbank', 'idbi', 'canarabank', 'pnb', 'airtel', 'barodapay', 'hsbc', 'rbl', 'indus', 'ubi', 'standardchartered', 'cbin', 'iob', 'sib', 'tjsb', 'kbl', 'dbs', 'bandhan', 'nsdl', 'jio', 'lvbank', 'punjabandsindh', 'idfcfirst', 'csb', 'citi', 'dlb', 'kvbank', 'jandkbank', 'equitas', 'dcb', 'aubank'
        ];
        return validDomains.includes(domain) ? '' : 'Invalid UPI ID domain.';
    };

    const getCategoryIcon = (category) => ({
        'cash': 'assets/icons/cash.svg', 'rent': 'assets/icons/rent.svg', 'salary': 'assets/icons/salary.svg', 'gift': 'assets/icons/gift.svg', 'investment': 'assets/icons/investment.svg', 'other': 'assets/icons/other.svg', 'food': 'assets/icons/food.svg', 'shopping': 'assets/icons/shopping-bag.svg', 'entertainment': 'assets/icons/entertainment.svg', 'travel': 'assets/icons/travel.svg', 'others': 'assets/icons/others.svg',
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
        // Only display confirmed transactions in the table
        allTransactions = storedTransactions.filter(t => t.status !== 'pending');
        console.log("Transactions loaded (excluding pending):", allTransactions);
        const filters = {
            type: filterType ? filterType.value : '',
            category: categoryFilter ? categoryFilter.value : '',
            startDate: startDateInput ? startDateInput.value : '',
            endDate: endDateInput ? endDateInput.value : '',
            search: searchBox && searchBox.value ? searchBox.value.toLowerCase() : ''
        };
        const displayedTransactions = filterTransactions(allTransactions, filters).slice(0, 50);
        if (transactionsTableBody) {
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
        } else {
            console.error("ERROR: loadTransactions: transactionsTableBody is null! Cannot render transactions.");
        }
        updateFilteredSummary(displayedTransactions, filters);
        if (filterType) updateCategoryFilterByType(filterType.value);
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
        // Only sum transactions with status 'success' for overall summary
        const transactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]').filter(t => t.status === 'success');
        console.log("DEBUG (updateOverallSummary): Transactions used for overall summary (status 'success' only):", transactions);
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += parseFloat(t.amount);
            } else if (t.type === 'expense') {
                totalExpenses += parseFloat(t.amount);
            }
        });


        function formatMoney(value) {
            // Convert the number to a string
            let numStr = value.toString();
            
            // Split into whole and decimal parts
            const parts = numStr.split('.');
            let wholePart = parts[0];
            const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
            
            // Add commas every 3 digits from the right
            wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            
            // Combine and return
            return wholePart + decimalPart;
        }
        
        totalIncome = formatMoney(totalIncome)
        totalExpenses = formatMoney(totalExpenses)

        console.log("DEBUG (updateOverallSummary): Calculated Total Income:", totalIncome);
        console.log("DEBUG (updateOverallSummary): Calculated Total Expenses:", totalExpenses);

        if (totalIncomeDisplay) totalIncomeDisplay.textContent = `₹${totalIncome}`;
        if (totalExpensesDisplay) totalExpensesDisplay.textContent = `₹${totalExpenses}`;
    };

    const handleUPISetupSubmit = (event) => {
        event.preventDefault();
        const upiId = upiIdInput ? upiIdInput.value.trim() : '';
        const username = usernameInput ? usernameInput.value.trim() : '';

        const upiIdErrorMessage = validateUPIId(upiId);
        if (upiIdError) upiIdError.textContent = upiIdErrorMessage;
        if (usernameError) usernameError.textContent = username ? '' : 'Please enter your name.';

        if (!upiIdErrorMessage && username) {
            setLocalStorageItem('earn_upiId', upiId);
            setLocalStorageItem('earn_username', username);
            hideUPISetupPopup();
            loadTransactions();
            updateOverallSummary();
        }
    };

    const updateCategoryFilterByType = (selectedType) => {
        if (categoryFilter) {
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
        }
    };

    const populateCategoryFilter = () => {
        const categories = ['food', 'shopping', 'entertainment', 'travel', 'others', 'salary', 'gift', 'investment', 'cash', 'other'];
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            // Clear existing options except the first "All Categories"
            while (categorySelect.options.length > 1) {
                categorySelect.remove(1);
            }
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categorySelect.appendChild(option);
            });
        }
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

            if (upiConfirmButton) {
                upiConfirmButton.onclick = () => {
                    console.log("Confirm button clicked for transaction ID:", latestPendingTransaction.id);
                    updateTransactionStatus(latestPendingTransaction.id, 'success');
                    upiConfirmationNotification.classList.remove('show'); // Hide popup
                    alert('Payment confirmed and added to your transactions!');
                    // Clear pending_upi_confirmation from localStorage after user confirms
                    localStorage.removeItem('pending_upi_confirmation');
                };
            }

            if (upiConfirmCancelButton) {
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
            }
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
        console.log("DEBUG (index.js): updateTransactionStatus called with ID:", transactionId, "and status:", newStatus);
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
    // This function is now defined within the single DOMContentLoaded
    function closeUpiSetupPopupHandler() { // Renamed to avoid conflict if function was outside
        if (upiSetupPopup) {
            upiSetupPopup.style.display = 'none';
        }
    }

    // Attach the close function to a button within the popup (example):
    if (closeUpiSetupButton) {
      closeUpiSetupButton.addEventListener('click', closeUpiSetupPopupHandler);
    }

    // Keep populateCategoryFilter call here as it depends on DOM being loaded
    populateCategoryFilter();

});
