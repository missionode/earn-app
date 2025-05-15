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

    const transactionsPerPage = 50;
    let allTransactions = [];
    let currentPage = 1;
    let editingTransactionId = null;

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
        const storedTransactions = JSON.parse(getLocalStorageItem('earn_transactions') || '[]');
        // Sort transactions by date and time in descending order (latest first)
        allTransactions = storedTransactions.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        renderTransactions();
        renderPagination();
    };

    const renderTransactions = () => {
        const startIndex = (currentPage - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;
        const currentTransactions = allTransactions.slice(startIndex, endIndex);

        allTransactionsTableBody.innerHTML = '';
        currentTransactions.forEach(transaction => {
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
            const editIcon = document.createElement('img');
            editIcon.src = 'assets/icons/edit.svg'; // Replace with your edit icon path
            editIcon.alt = 'Edit';
            editIcon.classList.add('edit-icon');
            editIcon.addEventListener('click', () => openEditPopup(transaction.id));
            actionsCell.appendChild(editIcon);
        });
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
        pageNumbersDiv.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.textContent = i;
            if (i === currentPage) {
                pageNumber.classList.add('active'); // You can add CSS for active page
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
        const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
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

    editTransactionForm.addEventListener('submit', (event) => {
        event.preventDefault();
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
            loadAllTransactions(); // Reload and re-render
            closeEditPopup();
        }
    });

    cancelEditButton.addEventListener('click', closeEditPopup);
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTransactions();
            updatePaginationButtons();
            updateActivePageNumber();
        }
    });

    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTransactions();
            updatePaginationButtons();
            updateActivePageNumber();
        }
    });

    loadAllTransactions();
});
