document.addEventListener('DOMContentLoaded', () => {
    const generateReportButton = document.getElementById('generateReport');

    if (generateReportButton) {
        generateReportButton.addEventListener('click', generateTransactionReport);
    } else {
        console.error('Generate Report button not found.');
    }

    function generateTransactionReport() {
        const reportTitle = 'Transaction Report';
        const userName = localStorage.getItem('earn_username') || 'User Name Not Available';
        const userUPI = localStorage.getItem('earn_upiId') || 'UPI ID Not Available';
        const a4Width = 210; // mm
        const a4Height = 297; // mm
        const margin = 15; // mm
        let yPosition = margin;
        const rowHeight = 7; // mm
        const fontSize = 10;
        const headerFontSize = 12;
        const descriptionColumnWidth = 40; // Width allocated for description

        const filteredTransactionsJSON = localStorage.getItem('filtered_transactions');
        const transactions = filteredTransactionsJSON ? JSON.parse(filteredTransactionsJSON) : [];

        if (transactions.length === 0) {
            alert('No transactions to report based on the current filters.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        pdf.setFontSize(headerFontSize);
        pdf.text(reportTitle, margin, yPosition);
        yPosition += headerFontSize + 5;

        pdf.setFontSize(fontSize);
        pdf.text(`Name: ${userName}`, margin, yPosition);
        yPosition += fontSize + 2;
        pdf.text(`UPI ID: ${userUPI}`, margin, yPosition);
        yPosition += fontSize + 5;

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += parseFloat(t.amount);
            } else if (t.type === 'expense') {
                totalExpense += parseFloat(t.amount);
            }
        });

        const currentFilterType = localStorage.getItem('current_filter_type') || '';
        pdf.setFont('helvetica', 'bold');
        if (currentFilterType === 'income') {
            pdf.text(`Total Income: ₹${totalIncome.toFixed(2)}`, margin, yPosition);
            yPosition += fontSize + 3;
        } else if (currentFilterType === 'expense') {
            pdf.text(`Total Expense: ₹${totalExpense.toFixed(2)}`, margin, yPosition);
            yPosition += fontSize + 3;
        } else {
            pdf.text(`Total Income: ₹${totalIncome.toFixed(2)}`, margin, yPosition);
            yPosition += fontSize + 3;
            pdf.text(`Total Expense: ₹${totalExpense.toFixed(2)}`, margin, yPosition);
            yPosition += fontSize + 3;
            pdf.text(`Net Balance: ₹${(totalIncome - totalExpense).toFixed(2)}`, margin, yPosition);
            yPosition += fontSize + 3;
        }
        pdf.setFont('helvetica', 'normal');
        yPosition += 5;

        // Define table headers
        const headers = ['Type', 'Category', 'Description', 'Amount', 'Date', 'Time'];
        const columnWidths = [15, 35, descriptionColumnWidth, 35, 25, 15];
        let xPosition = margin;

        pdf.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
            pdf.text(header, xPosition, yPosition);
            xPosition += columnWidths[index];
        });
        yPosition += rowHeight + 2;
        pdf.setFont('helvetica', 'normal');

        // Add transaction data
        transactions.forEach(transaction => {
            xPosition = margin;
            const rowData = [
                transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
                transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1),
                transaction.description || '-',
                `${transaction.type === 'expense' ? '-' : '+' }₹${parseFloat(transaction.amount).toFixed(2)}`,
                transaction.date,
                transaction.time
            ];

            let currentY = yPosition;
            const descriptionLines = pdf.splitTextToSize(rowData[2], columnWidths[2] - 5); // -5 for a little padding
            const descriptionLineHeight = pdf.getTextDimensions('M', { fontSize: fontSize }).h; // Approximate line height

            rowData[2] = descriptionLines; // Replace the single description with the array of lines

            rowData.forEach((data, index) => {
                let textToPrint = data;
                if (index === 2 && Array.isArray(data)) {
                    data.forEach((line, lineIndex) => {
                        pdf.text(line, xPosition, currentY + lineIndex * descriptionLineHeight);
                    });
                    const linesCount = data.length;
                    currentY += linesCount * descriptionLineHeight;
                } else {
                    if (index === 3) {
                        console.log('Amount being printed:', textToPrint); // ADD THIS LINE IN report.js
                    }
                    pdf.text(textToPrint, xPosition, currentY);
                }
                xPosition += columnWidths[index];
            });
            yPosition = Math.max(yPosition + rowHeight, currentY + (Array.isArray(rowData[2]) ? (rowData[2].length -1) * descriptionLineHeight : 0));

            if (yPosition > a4Height - margin - rowHeight) {
                pdf.addPage();
                yPosition = margin;
                pdf.setFontSize(fontSize);
            }
        });

        // Save or open the PDF
        pdf.save('transaction_report.pdf');
        // pdf.output('dataurlnewwindow'); // To open in a new window
    }
});