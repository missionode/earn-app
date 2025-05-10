document.addEventListener('DOMContentLoaded', () => {
    const sendForm = document.getElementById('sendForm');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const qrScannerPopup = document.getElementById('qrScannerPopup');
    const qrScannerView = document.getElementById('qrScannerView');
    const closeScannerButton = document.getElementById('closeScanner');

    let amount; // Declare amount outside the submit listener
    let description; // Declare description outside the submit listener

    sendForm.addEventListener('submit', (event) => {
        event.preventDefault();

        amount = parseFloat(amountInput.value); // Assign to the outer scope variable
        description = descriptionInput.value; // Assign to the outer scope variable

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        qrScannerPopup.style.display = 'block';
        startQrScanner();
    });

    closeScannerButton.addEventListener('click', () => {
        qrScannerPopup.style.display = 'none';
        stopCamera(); // Ensure camera is stopped when closing
    });

    let streamGlobal; // To store the camera stream globally for stopCamera()

    function startQrScanner() {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                streamGlobal = stream; // Store the stream globally
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();

                video.addEventListener('loadedmetadata', () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    qrScannerView.appendChild(canvas);

                    function scan() {
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, canvas.width, canvas.height);

                        if (code) {
                            stopCamera(stream);
                            qrScannerPopup.style.display = 'none';
                            const recipientVPA = extractVPAFromQRCode(code.data);
                            if (recipientVPA) {
                                initiateUpiPayment(recipientVPA, amount, description); // Use outer scope variables
                            } else {
                                alert('Invalid UPI QR code.');
                            }
                        } else {
                            requestAnimationFrame(scan);    
                        }
                    }

                    scan();
                });
            })
            .catch(err => {
                console.error('Error accessing camera:', err);
                alert('Error accessing camera.');
            });
    }

    function stopCamera(stream) {
        if (!stream && streamGlobal) {
            stream = streamGlobal;
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (qrScannerView.firstChild) {
            qrScannerView.removeChild(qrScannerView.firstChild); // Clean up canvas
        }
    }

    function extractVPAFromQRCode(qrCodeText) {
        // Implement your VPA extraction logic here (example below)
        if (qrCodeText && qrCodeText.includes("pa=")) {
            const vpaStart = qrCodeText.indexOf("pa=") + 3;
            let vpaEnd = qrCodeText.indexOf("&", vpaStart);
            if (vpaEnd === -1) {
                vpaEnd = qrCodeText.length;
            }
            return qrCodeText.substring(vpaStart, vpaEnd);
        }
        return null;
    }

    function initiateUpiPayment(recipientVPA, amount, description) {
        const transactionId = generateUniqueId();
        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(recipientVPA)}&pn=${encodeURIComponent('Recipient Name')}&am=${amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(transactionId)}&tn=${encodeURIComponent(description)}`;
        window.location.href = upiIntentUrl;
    }

    function saveTransaction(transaction) {
        let transactions = JSON.parse(localStorage.getItem('earn_transactions') || '[]');
        transactions.unshift(transaction);
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
    }

    function generateUniqueId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
});