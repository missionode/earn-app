document.addEventListener('DOMContentLoaded', () => {
    const sendForm = document.getElementById('sendForm');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categoryFood = document.getElementById('categoryFood');
    const categoryShopping = document.getElementById('categoryShopping');
    const categoryEntertainment = document.getElementById('categoryEntertainment');
    const categoryTravel = document.getElementById('categoryTravel');
    const categoryOthers = document.getElementById('categoryOthers');
    const qrScannerPopup = document.getElementById('qrScannerPopup');
    const qrScannerView = document.getElementById('qrScannerView');
    const closeScannerButton = document.getElementById('closeScanner');

    let amount;
    let description;
    let category = '';
    let streamGlobal;
    let extractedUPIID;
    let extractedMerchantName;

    sendForm.addEventListener('submit', (event) => {
        event.preventDefault();

        amount = parseFloat(amountInput.value);
        description = descriptionInput.value;
        category = getSelectedCategory(); // Get the selected category

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        qrScannerPopup.style.display = 'block';
        startQrScanner();
    });

    closeScannerButton.addEventListener('click', () => {
        qrScannerPopup.style.display = 'none';
        stopCamera();
    });

    function getSelectedCategory() {
        if (categoryFood.checked) return 'food';
        if (categoryShopping.checked) return 'shopping';
        if (categoryEntertainment.checked) return 'entertainment';
        if (categoryTravel.checked) return 'travel';
        if (categoryOthers.checked) return 'others';
        return ''; // Default or handle no selection as needed
    }

    function startQrScanner() {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
    
        // Clear any existing content in qrScannerView
        qrScannerView.innerHTML = '';
    
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                streamGlobal = stream;
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();
    
                video.addEventListener('loadedmetadata', () => {
                    const aspectRatioVideo = video.videoWidth / video.videoHeight || 1;
                    const aspectRatioCanvas = window.innerWidth / window.innerHeight;
                    let width, height;
    
                    if (aspectRatioCanvas > aspectRatioVideo) {
                        height = window.innerHeight;
                        width = height * aspectRatioVideo;
                    } else {
                        width = window.innerWidth;
                        height = width / aspectRatioVideo;
                    }
    
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    qrScannerView.appendChild(canvas);
    
                    context.fillStyle = 'black';
                    context.fillRect(0, 0, canvas.width, canvas.height);
    
                    const offsetX = (canvas.width - width) / 2;
                    const offsetY = (canvas.height - height) / 2;
    
                    function scan() {
                        context.drawImage(video, offsetX, offsetY, width, height);
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, canvas.width, canvas.height);
    
                        if (code) {
                            stopCamera(stream);
                            qrScannerPopup.style.display = 'none';
                            const qrData = extractDataFromQRCode(code.data);
                            extractedUPIID = qrData.upiId;
                            extractedMerchantName = qrData.merchantName;
                            if (extractedUPIID) {
                                initiateUpiPayment(extractedUPIID, amount, description, category, extractedMerchantName);
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
            qrScannerView.removeChild(qrScannerView.firstChild);
        }
    }

    function extractDataFromQRCode(qrCodeText) {
        let upiId = null;
        let merchantName = null;

        if (qrCodeText && qrCodeText.includes("pa=")) {
            const vpaStart = qrCodeText.indexOf("pa=") + 3;
            let vpaEnd = qrCodeText.indexOf("&", vpaStart);
            if (vpaEnd === -1) {
                vpaEnd = qrCodeText.length;
            }
            upiId = qrCodeText.substring(vpaStart, vpaEnd);
        }

        if (qrCodeText && qrCodeText.includes("pn=")) {
            const nameStart = qrCodeText.indexOf("pn=") + 3;
            let nameEnd = qrCodeText.indexOf("&", nameStart);
            if (nameEnd === -1) {
                nameEnd = qrCodeText.length;
            }
            merchantName = qrCodeText.substring(nameStart, nameEnd);
        }

        return { upiId, merchantName };
    }

    function initiateUpiPayment(recipientVPA, amount, description, category, merchantNameFromQR) {
        const transactionId = generateUniqueId();
        const payeeName = merchantNameFromQR || localStorage.getItem('earn_username') || 'Recipient Name';
        const merchantCategoryCode = '0000';

        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(recipientVPA)}&pn=${encodeURIComponent(payeeName)}&am=${parseFloat(amount).toFixed(2)}&cu=INR&tr=${encodeURIComponent(transactionId)}&tn=${encodeURIComponent(description)}&mc=${merchantCategoryCode}`;

        console.log("Generated UPI Intent URL:", upiIntentUrl); // For debugging

        window.location.href = upiIntentUrl;
        saveTransaction({
            type: 'expense',
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0]
        });
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
