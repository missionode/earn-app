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

    // --- Helper Functions ---
    function getLocalStorageItem(key) {
        return localStorage.getItem(key);
    }

    function setLocalStorageItem(key, value) {
        localStorage.setItem(key, value);
    }

    function isFirstTimeUser() {
        return !getLocalStorageItem('earn_upiId') || !getLocalStorageItem('earn_username');
    }

    function displayUPISetupPopup() {
        upiSetupPopup.style.display = 'block';
    }

    function hideUPISetupPopup() {
        upiSetupPopup.style.display = 'none';
    }

    function validateUPIId(upiId) {
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,}@[a-zA-Z]{2,}$/.test(upiId)) {
            return 'Invalid UPI ID format.';
        }
        const domain = upiId.split('@')[1];
        const validDomains = ['ybl', 'upi', 'okhdfcbank', 'icici', 'axisbank', 'oksbi', 'paytm','fbl']; // Example list
        if (!validDomains.includes(domain)) {
            return 'Invalid UPI ID domain.';
        }
        return '';
    }

    function getCategoryIcon(category) {
        switch (category) {
            case 'cash': return 'assets/icons/cash.svg';
            case 'rent': return 'assets/icons/rent.svg';
            case 'salary': return 'assets/icons/salary.svg';
            case 'other': return 'assets/icons/other.svg';
            case 'food': return 'assets/icons/food.svg';
            case 'shopping': return 'assets/icons/shopping-bag.svg';
            case 'entertainment': return 'assets/icons/entertainment.svg';
            case 'travel': return 'assets/icons/travel.svg';
            case 'others': return 'assets/icons/others.svg';
            default: return '';
        }
    }

    function filterTransactions(transactions, filters) {
        let filteredTransactions = [...transactions]; // Create a copy to avoid modifying the original

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
            filteredTransactions = filteredTransactions.filter(t => t.description.toLowerCase().includes(filters.search));
        }

        return filteredTransactions;
    }

    function loadTransactions() {
        let transactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
    
        // Apply filters
        const filters = {
            category: categoryFilter.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            search: searchBox.value.toLowerCase()
        };
        transactions = filterTransactions(transactions, filters);
    
        // Take the first 50 transactions after filtering
        const displayedTransactions = transactions.slice(0, 50);
    
        transactionsTableBody.innerHTML = '';
        displayedTransactions.forEach(transaction => {
            const row = transactionsTableBody.insertRow();
            const typeCell = row.insertCell();
            const categoryCell = row.insertCell();
            const descriptionCell = row.insertCell();
            const amountCell = row.insertCell();
            const dateCell = row.insertCell();
            const timeCell = row.insertCell();
    
            typeCell.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
            let categoryIcon = getCategoryIcon(transaction.category);
            if (!categoryIcon) {
                categoryIcon = 'assets/icons/default.svg'; // Use a default icon path
            }
            categoryCell.innerHTML = categoryIcon ? `<img src="${categoryIcon}" alt="${transaction.category}">` : transaction.category;
            descriptionCell.textContent = transaction.description || '-';
            amountCell.textContent = `₹${transaction.amount.toFixed(2)}`;
            dateCell.textContent = transaction.date;
            timeCell.textContent = transaction.time;
        });
        updateSummary();
    }

    function updateSummary() {
        const transactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpenses += t.amount;
            }
        });

        totalIncomeDisplay.textContent = `₹${totalIncome.toFixed(2)}`;
        totalExpensesDisplay.textContent = `₹${totalExpenses.toFixed(2)}`;
    }

    function handleUPISetupSubmit(event) {
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
            loadTransactions(); // Load transactions after setup for new users
        }
    }

    function applyFilters() {
        const filters = {
            category: categoryFilter.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            search: searchBox.value
        };
        loadTransactions(filters);
    }

    // --- Event Listeners ---
    if (isFirstTimeUser()) {
        displayUPISetupPopup();
    } else {
        loadTransactions();
    }

    upiSetupForm.addEventListener('submit', handleUPISetupSubmit);

    receiveMoneyBtn.addEventListener('click', () => {
        window.location.href = 'receive.html';
    });

    sendMoneyBtn.addEventListener('click', () => {
        window.location.href = 'send.html';
    });

    categoryFilter.addEventListener('change', loadTransactions);
    searchBox.addEventListener('input', loadTransactions);
    startDateInput.addEventListener('change', loadTransactions);
    endDateInput.addEventListener('change', loadTransactions);

    //# allFunctionsCalledOnLoad - Ensuring initial functions are called
    updateSummary(); // Call again to ensure initial values are set if transactions exist
});