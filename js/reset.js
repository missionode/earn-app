document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('resetButton');
    const cancelButton = document.getElementById('cancelButton');
    const resetMessage = document.getElementById('reset-message');

    resetButton.addEventListener('click', () => {
        // Logic to clear localStorage
        localStorage.removeItem('earn_transactions');
        localStorage.removeItem('earn_upiId');
        localStorage.removeItem('earn_username');
        localStorage.removeItem('pending_receive_transaction');
        localStorage.removeItem('pending_upi_confirmation');
        localStorage.removeItem('hideDetails');

        // Display confirmation message
        resetMessage.textContent = 'App data has been reset.';
        resetMessage.classList.remove('hidden');

        // Optionally, redirect to the main page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });

    cancelButton.addEventListener('click', () => {
        // Go back to the previous page (or a specific page)
        window.history.back(); // Attempts to go to the previous page in history
        // Or: window.location.href = 'index.html'; // To go to the main page
    });
});
