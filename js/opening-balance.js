const EarnOpeningBalance = (() => {
    const TRANSACTION_ID = 'earn-opening-balance';
    const STORAGE_KEY = 'earn_openingBalance';

    const normalizeAmount = (value) => {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount < 0) {
            throw new TypeError('Opening balance must be a non-negative number.');
        }
        return Number(amount.toFixed(2));
    };

    const syncOpeningBalance = (storage, value, now = new Date()) => {
        const amount = normalizeAmount(value);
        const transactions = JSON.parse(storage.getItem('earn_transactions') || '[]');
        const existingIndex = transactions.findIndex((transaction) =>
            transaction.id === TRANSACTION_ID || transaction.isOpeningBalance === true);
        const existing = existingIndex >= 0 ? transactions[existingIndex] : null;

        storage.setItem(STORAGE_KEY, amount.toString());

        if (amount === 0) {
            if (existingIndex >= 0) {
                transactions.splice(existingIndex, 1);
                storage.setItem('earn_transactions', JSON.stringify(transactions));
            }
            return null;
        }

        const transaction = {
            ...existing,
            id: TRANSACTION_ID,
            type: 'income',
            amount,
            category: 'cash',
            description: 'Opening balance',
            date: existing?.date || now.toISOString().split('T')[0],
            time: existing?.time || now.toTimeString().split(' ')[0],
            status: 'success',
            isOpeningBalance: true,
        };

        if (existingIndex >= 0) {
            transactions[existingIndex] = transaction;
        } else {
            transactions.push(transaction);
        }
        storage.setItem('earn_transactions', JSON.stringify(transactions));
        return transaction;
    };

    return { STORAGE_KEY, TRANSACTION_ID, normalizeAmount, syncOpeningBalance };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarnOpeningBalance;
}
