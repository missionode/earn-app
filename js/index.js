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

    let allTransactions = [];

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
        const validDomains = ['ybl', 'upi', 'okhdfcbank', 'icici', 'axisbank', 'oksbi', 'paytm', 'fbl', 'okicici'];
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
            case 'gift': return 'assets/icons/gift.svg';
            case 'investment': return 'assets/icons/investment.svg';
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
            filteredTransactions = filteredTransactions.filter(t => t.description.toLowerCase().includes(filters.search));
        }

        return filteredTransactions;
    }

    function loadTransactions() {
        allTransactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');

        const filters = {
            type: filterType.value,
            category: categoryFilter.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            search: searchBox.value.toLowerCase()
        };
        const isFilterActive = Object.values(filters).some(value => value && value !== '');
        let displayedTransactions = filterTransactions(allTransactions, filters);

        if (!isFilterActive) {
            displayedTransactions = displayedTransactions.slice(0, 50); // Apply limit only when no filter
        }

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
                categoryIcon = 'assets/icons/default.svg';
            }
            categoryCell.innerHTML = categoryIcon ? `<img src="${categoryIcon}" alt="${transaction.category}">` : transaction.category;
            descriptionCell.textContent = transaction.description || '-';
            amountCell.textContent = `₹${parseFloat(transaction.amount).toFixed(2)}`;
            if (transaction.type === 'expense') {
                amountCell.classList.add('expense');
                amountCell.textContent = `- ${amountCell.textContent}`;
            } else if (transaction.type === 'income') {
                amountCell.classList.add('income');
                amountCell.textContent = `+ ${amountCell.textContent}`;
            }
            dateCell.textContent = transaction.date;
            timeCell.textContent = transaction.time;
        });

        updateFilteredSummary(displayedTransactions, filters); // Pass filters to updateFilteredSummary
        updateCategoryFilterByType(filterType.value);
    }

    function updateFilteredSummary(transactions, filters) {
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
    }

    function updateOverallSummary() {
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
            loadTransactions();
            updateOverallSummary();
        }
    }

    function updateCategoryFilterByType(selectedType) {
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

    function populateCategoryFilter() {
        const categories = ['food', 'shopping', 'entertainment', 'travel', 'others', 'salary', 'gift', 'investment', 'cash', 'other'];
        const categorySelect = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categorySelect.appendChild(option);
        });
    }

    // --- Event Listeners ---
    if (isFirstTimeUser()) {
        displayUPISetupPopup();
    } else {
        loadTransactions();
        updateOverallSummary();
    }

    upiSetupForm.addEventListener('submit', handleUPISetupSubmit);
    receiveMoneyBtn.addEventListener('click', () => {
        window.location.href = 'receive.html';
    });
    sendMoneyBtn.addEventListener('click', () => {
        window.location.href = 'send.html';
    });

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

    populateCategoryFilter();
});