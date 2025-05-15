document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('upload-status');
    const downloadButton = document.getElementById('downloadButton');
    const downloadStatus = document.getElementById('download-status');

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
                try {
                    const transactions = parseCSV(contents);

                    if (transactions && transactions.length > 0) {
                        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
                        uploadStatus.textContent = `Successfully loaded ${transactions.length} entries to local storage.`;
                        uploadStatus.classList.add('success');
                    } else {
                        uploadStatus.textContent = 'Error parsing CSV or empty data.';
                        uploadStatus.classList.add('error');
                    }
                } catch (error) {
                    console.error("Error parsing CSV:", error);
                    uploadStatus.textContent = 'Error parsing CSV.';
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

    downloadButton.addEventListener('click', () => {
        const data = localStorage.getItem('earn_transactions');
        if (!data) {
            downloadStatus.textContent = 'No data found in local storage.';
            downloadStatus.classList.remove('hidden');
            downloadStatus.classList.add('error');
            return;
        }

        try {
            const transactions = JSON.parse(data);
            if (!Array.isArray(transactions) || transactions.length === 0) {
                downloadStatus.textContent = 'No transaction data to download.';
                downloadStatus.classList.remove('hidden');
                downloadStatus.classList.add('error');
                return;
            }
            const csvContent = convertToCSV(transactions);
            downloadCSV(csvContent, 'transactions.csv');
            downloadStatus.textContent = 'CSV file downloaded.';
            downloadStatus.classList.remove('hidden');
            downloadStatus.classList.remove('error');

        } catch (error) {
            console.error("Error converting to CSV:", error);
            downloadStatus.textContent = 'Error generating CSV file.';
            downloadStatus.classList.remove('hidden');
            downloadStatus.classList.add('error');
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
                    let value = values[j].trim();
                    if (headers[j] === 'amount') {
                        const parsedAmount = parseFloat(value);
                        transaction[headers[j]] = isNaN(parsedAmount) ? 0 : parsedAmount; // Default to 0 if not a number
                    } else {
                        transaction[headers[j]] = value;
                    }
                }
                transactions.push(transaction);
            }
        }
        return transactions;
    }

    function convertToCSV(transactions) {
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return '';
        }
        const headers = Object.keys(transactions[0]);
        const headerRow = headers.join(',');
        const rows = transactions.map(transaction => {
            return headers.map(header => {
                let value = transaction[header];
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""'); // Escape double quotes
                    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                        value = `"${value}"`; // Quote the value if it contains commas, newlines, or quotes
                    }
                }
                return value;
            }).join(',');
        });
        return `${headerRow}\n${rows.join('\n')}`;
    }

    function downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});
