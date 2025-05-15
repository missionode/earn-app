document.addEventListener('DOMContentLoaded', () => {
    const allTransactionsTableBody = document.getElementById('allTransactionsTable').querySelector('tbody');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const pageNumbersDiv = document.getElementById('pageNumbers');
    const editTransactionPopup = document.getElementById('editTransactionPopup');
    const editTransactionForm = document.getElementById('editTransactionForm');
    const cancelEditButton = document.getElementById('cancelEdit');
    const editTransactionIdInput = document.getElementById('editTransactionId');
    const editTypeInput = document.getElementById('editType');
    const editCategoryInput = document.getElementById('editCategory');
    const editDescriptionInput = document.getElementById('editDescription');
    const editAmountInput = document.getElementById('editAmount');
    const editDateInput = document.getElementById('editDate');
    const editTimeInput = document.getElementById('editTime');
    const filterTypeSelect = document.getElementById('filterType');
    const filterCategorySelect = document.getElementById('filterCategory');
    const filterStartDateInput = document.getElementById('filterStartDate');
    const filterEndDateInput = document.getElementById('filterEndDate');
    const clearFiltersButton = document.getElementById('clearFilters');
    const generateReportButton = document.getElementById('generateReport');

    const transactionsPerPage = 50;
    let allTransactions = [];
    let filteredTransactions = [];
    let currentPage = 1;
    let editingTransactionId = null;
    let currentFilters = { type: '', category: '', startDate: '', endDate: '' };

    const getLocalStorageItem = (key) => localStorage.getItem(key);
    const setLocalStorageItem = (key, value) => localStorage.setItem(key, value);

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

    const loadAllTransactions = () => {
        console.log('loadAllTransactions() called');
        const storedTransactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        console.log('Stored Transactions:', storedTransactions);
        allTransactions = storedTransactions.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        applyFilters();
    };

    const applyFilters = () => {
        console.log('applyFilters() called');
        filteredTransactions = allTransactions.filter(transaction => {
            const typeMatch = !currentFilters.type || transaction.type === currentFilters.type;
            const categoryMatch = !currentFilters.category || transaction.category === currentFilters.category;

            const transactionDate = new Date(transaction.date);
            const startDate = currentFilters.startDate ? new Date(currentFilters.startDate) : null;
            const endDate = currentFilters.endDate ? new Date(currentFilters.endDate) : null;

            const startDateMatch = !startDate || transactionDate >= startDate;
            const endDateMatch = !endDate || transactionDate <= endDate;

            return typeMatch && categoryMatch && startDateMatch && endDateMatch;
        });
        console.log('Filtered Transactions:', filteredTransactions);
        currentPage = 1;
        localStorage.setItem('filtered_transactions', JSON.stringify(filteredTransactions));

        if (generateReportButton) {
            generateReportButton.style.display = filteredTransactions.length > 0 ? 'block' : 'none';
        }

        renderTransactions();
        renderPagination();
        console.log('applyFilters() finished');
    };

    const renderTransactions = () => {
        console.log('renderTransactions() called');
        const startIndex = (currentPage - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;
        const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

        console.log('Current Page:', currentPage);
        console.log('Transactions to Render (slice):', currentTransactions);
        console.log('Table Body Element:', allTransactionsTableBody);

        if (!allTransactionsTableBody) {
            console.error('Error: allTransactionsTableBody is null. Check your HTML.');
            return;
        }

        allTransactionsTableBody.innerHTML = '';
        currentTransactions.forEach(transaction => {
            console.log('Rendering Transaction:', transaction);
            const row = allTransactionsTableBody.insertRow();
            row.insertCell().innerHTML = transaction.type === 'expense' ? '<img src="assets/icons/arrow-up.svg" alt="Expense" class="transaction-icon">' : '<img src="assets/icons/arrow-down.svg" alt="Income" class="transaction-icon">';
            const categoryCell = row.insertCell();
            const icon = getCategoryIcon(transaction.category) || 'assets/icons/default.svg';
            categoryCell.innerHTML = `<img src="${icon}" alt="${transaction.category}">`;
            row.insertCell().textContent = transaction.description || '-';
            const amountCell = row.insertCell();
            const formattedAmount = `₹${parseFloat(transaction.amount).toFixed(2)}`;
            amountCell.textContent = transaction.type === 'expense' ? `- ${formattedAmount}` : `+ ${formattedAmount}`;
            amountCell.classList.add(transaction.type === 'expense' ? 'expense' : 'income');
            row.insertCell().textContent = transaction.date;
            row.insertCell().textContent = transaction.time;
            row.insertCell().textContent = transaction.status || '';
            const actionsCell = row.insertCell();

            const editWrapper = document.createElement('div');
            editWrapper.classList.add('action-icon-wrapper');
            const editIcon = document.createElement('img');
            editIcon.src = 'assets/icons/edit.svg';
            editIcon.alt = 'Edit';
            editIcon.classList.add('edit-icon');
            editIcon.addEventListener('click', () => openEditPopup(transaction.id));
            editWrapper.appendChild(editIcon);
            actionsCell.appendChild(editWrapper);

            const deleteWrapper = document.createElement('div');
            deleteWrapper.classList.add('action-icon-wrapper');
            const deleteIcon = document.createElement('img');
            deleteIcon.src = 'assets/icons/delete.svg';
            deleteIcon.alt = 'Delete';
            deleteIcon.classList.add('delete-icon');
            deleteIcon.addEventListener('click', () => deleteTransaction(transaction.id));
            deleteWrapper.appendChild(deleteIcon);
            actionsCell.appendChild(deleteWrapper);
        });
        console.log('renderTransactions() finished');
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
        pageNumbersDiv.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.textContent = i;
            if (i === currentPage) {
                pageNumber.classList.add('active');
            }
            pageNumber.addEventListener('click', () => {
                currentPage = i;
                renderTransactions();
                updatePaginationButtons();
                updateActivePageNumber();
            });
            pageNumbersDiv.appendChild(pageNumber);
        }

        updatePaginationButtons();
    };

    const updatePaginationButtons = () => {
        const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
    };

    const updateActivePageNumber = () => {
        const pageNumberButtons = pageNumbersDiv.querySelectorAll('button');
        pageNumberButtons.forEach(button => button.classList.remove('active'));
        const activePageButton = pageNumbersDiv.querySelector(`button:nth-child(${currentPage})`);
        if (activePageButton) {
            activePageButton.classList.add('active');
        }
    };

    const openEditPopup = (transactionId) => {
        editingTransactionId = transactionId;
        const transactionToEdit = allTransactions.find(t => t.id === transactionId);
        if (transactionToEdit) {
            editTransactionIdInput.value = transactionToEdit.id;
            editTypeInput.value = transactionToEdit.type;
            editCategoryInput.value = transactionToEdit.category;
            editDescriptionInput.value = transactionToEdit.description || '';
            editAmountInput.value = transactionToEdit.amount;
            editDateInput.value = transactionToEdit.date;
            editTimeInput.value = transactionToEdit.time;
            editTransactionPopup.style.display = 'block';
        }
    };

    const closeEditPopup = () => {
        editTransactionPopup.style.display = 'none';
        editingTransactionId = null;
    };

    const saveEditedTransaction = () => {
        if (editingTransactionId) {
            const updatedTransactions = allTransactions.map(transaction => {
                if (transaction.id === editingTransactionId) {
                    return {
                        ...transaction,
                        type: editTypeInput.value,
                        category: editCategoryInput.value,
                        description: editDescriptionInput.value,
                        amount: parseFloat(editAmountInput.value),
                        date: editDateInput.value,
                        time: editTimeInput.value,
                    };
                }
                return transaction;
            });
            setLocalStorageItem('earn_transactions', JSON.stringify(updatedTransactions));
            loadAllTransactions();
            closeEditPopup();
        }
    };

    editTransactionForm.addEventListener('submit', (event) => {
        event.preventDefault();
        saveEditedTransaction();
    });

    cancelEditButton.addEventListener('click', closeEditPopup);

    const deleteTransaction = (transactionIdToDelete) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const updatedTransactions = allTransactions.filter(transaction => transaction.id !== transactionIdToDelete);
            setLocalStorageItem('earn_transactions', JSON.stringify(updatedTransactions));
            loadAllTransactions();
        }
    };

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTransactions();
            updatePaginationButtons();
            updateActivePageNumber();
        }
    });

    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTransactions();
            updatePaginationButtons();
            updateActivePageNumber();
        }
    });

    filterTypeSelect.addEventListener('change', () => {
        currentFilters.type = filterTypeSelect.value;
        applyFilters();
    });

    filterCategorySelect.addEventListener('change', () => {
        currentFilters.category = filterCategorySelect.value;
        applyFilters();
    });

    filterStartDateInput.addEventListener('change', () => {
        currentFilters.startDate = filterStartDateInput.value;
        applyFilters();
    });

    filterEndDateInput.addEventListener('change', () => {
        currentFilters.endDate = filterEndDateInput.value;
        applyFilters();
    });

    clearFiltersButton.addEventListener('click', () => {
        currentFilters = { type: '', category: '', startDate: '', endDate: '' };
        applyFilters();
    });

    loadAllTransactions();
});