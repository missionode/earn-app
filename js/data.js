document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('upload-status');

    uploadForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (file) {
            uploadStatus.textContent = 'Reading file...';
            uploadStatus.classList.remove('hidden');

            const reader = new FileReader();

            reader.onload = function(e) {
                const contents = e.target.result;
                const transactions = parseCSV(contents);

                if (transactions && transactions.length > 0) {
                    localStorage.setItem('earn_transactions', JSON.stringify(transactions));
                    uploadStatus.textContent = `Successfully loaded ${transactions.length} entries to local storage.`;
                    uploadStatus.classList.add('success');
                } else {
                    uploadStatus.textContent = 'Error parsing CSV or empty data.';
                    uploadStatus.classList.add('error');
                }
            };

            reader.onerror = function() {
                uploadStatus.textContent = 'Error reading the CSV file.';
                uploadStatus.classList.add('error');
            };

            reader.readAsText(file);
        } else {
            uploadStatus.textContent = 'Please select a CSV file.';
            uploadStatus.classList.remove('hidden');
            uploadStatus.classList.add('error');
        }
    });

    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length <= 1) { // No data rows or just headers
            return [];
        }
        const headers = lines[0].split(',');
        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const transaction = {};
                for (let j = 0; j < headers.length; j++) {
                    transaction[headers[j]] = values[j].trim();
                }
                transactions.push(transaction);
            }
        }
        return transactions;
    }
});
