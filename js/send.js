document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const input = document.getElementById("amount");
        input.focus();
        input.select(); // optional
    }, 300); // delay ensures mobile keyboard show

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
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const toggleFlashButton = document.getElementById('toggleFlash');
    const toggleDetailsSwitch = document.getElementById('toggleDetails');
    const detailsFields = document.getElementById('detailsFields');

    let flashEnabled = false;
    let videoTrack = null;
    let streamGlobal;
    let extractedUPIID;
    let extractedMerchantName;
    let html5QrCode = null; // To hold the instance
    let qrCodeDetected = false;

    // Load the saved switch state from local storage
    const savedDetailsState = localStorage.getItem('showDetails');
    if (savedDetailsState === 'false') {
        toggleDetailsSwitch.checked = false;
        detailsFields.classList.add('hidden');
    } else {
        toggleDetailsSwitch.checked = true;
        detailsFields.classList.remove('hidden');
    }

    // Event listener for the toggle switch
    toggleDetailsSwitch.addEventListener('change', () => {
        detailsFields.classList.toggle('hidden');
        localStorage.setItem('showDetails', toggleDetailsSwitch.checked);
    });

    sendForm.addEventListener('submit', (event) => {
        event.preventDefault();

        amount = parseFloat(amountInput.value);
        const category = toggleDetailsSwitch.checked ? getSelectedCategory() : '';
        const description = toggleDetailsSwitch.checked ? descriptionInput.value : '';

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
        if (html5QrCode) {
            html5QrCode.stop();
            html5QrCode.clear();
            html5QrCode = null;
        }
        qrCodeDetected = false;
    });

    addExpenseBtn.addEventListener('click', () => {
        const manualExpenseAmount = parseFloat(amountInput.value);
        const manualExpenseDescription = toggleDetailsSwitch.checked ? descriptionInput.value : '';
        const manualExpenseCategory = toggleDetailsSwitch.checked ? getSelectedCategory() : '';

        if (isNaN(manualExpenseAmount) || manualExpenseAmount <= 0) {
            alert('Please enter a valid expense amount.');
            return;
        }

        const newExpenseTransaction = {
            id: generateUniqueId(),
            type: 'expense',
            amount: manualExpenseAmount,
            category: manualExpenseCategory,
            description: manualExpenseDescription,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            status: 'success' // Manual entry is directly added as success
        };

        saveTransaction(newExpenseTransaction);
        window.location.href = 'index.html';
    });

    function getSelectedCategory() {
        if (categoryFood.checked) return 'food';
        if (categoryShopping.checked) return 'shopping';
        if (categoryEntertainment.checked) return 'entertainment';
        if (categoryTravel.checked) return 'travel';
        if (categoryOthers.checked) return 'others';
        return '';
    }

    function startQrScanner() {
        qrScannerView.innerHTML = '';
        qrCodeDetected = false;
        html5QrCode = new Html5Qrcode("qrScannerView");
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            if (!qrCodeDetected) {
                qrCodeDetected = true;
                stopCamera();
                qrScannerPopup.style.display = 'none';
                const qrData = extractDataFromQRCode(decodedText);
                extractedUPIID = qrData.upiId;
                extractedMerchantName = qrData.merchantName;
                if (extractedUPIID) {
                    const category = toggleDetailsSwitch.checked ? getSelectedCategory() : '';
                    const description = toggleDetailsSwitch.checked ? descriptionInput.value : '';
                    initiateUpiPayment(extractedUPIID, amount, description, category, extractedMerchantName);
                } else {
                    alert('Invalid UPI QR code.');
                }
            }
        };

        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0) {
                const rearCamera = devices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear'));
                const cameraId = rearCamera ? rearCamera.id : devices[0].id;

                const initialZoomFactor = 2.0; // Adjust this value based on testing

                const config = {
                    fps: 10,
                    qrbox: 300,
                    videoConstraints: {
                        facingMode: "environment",
                        advanced: [{ zoom: initialZoomFactor }]
                    }
                };

                html5QrCode.start(cameraId, config, qrCodeSuccessCallback)
                    .catch(err => {
                        console.error('Error starting QR scanner with initial zoom:', err);
                        // If initial zoom fails, try starting without it
                        html5QrCode.start(cameraId, { fps: 10, qrbox: 300 }, qrCodeSuccessCallback)
                            .catch(err2 => {
                                console.error('Error starting QR scanner without zoom:', err2);
                                alert('Error starting QR scanner.');
                            });
                    });
            } else {
                alert("No cameras found on this device.");
            }
        }).catch(err => {
            console.error("Error getting camera devices:", err);
            alert("Error getting camera devices.");
        });
    }

    function stopCamera() {
        if (streamGlobal) {
            streamGlobal.getTracks().forEach(track => track.stop());
            streamGlobal = null;
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
        const successUrl = encodeURIComponent(`https://missionode.github.io/earn-app/index.html?status=success&transactionId=${transactionId}`);

        let encodedDescription = encodeURIComponent(description);
        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(recipientVPA)}&pn=${encodeURIComponent(payeeName)}&am=${parseFloat(amount).toFixed(2)}&cu=INR&tr=${encodeURIComponent(transactionId)}&tn=${encodedDescription.replace(/%20/g, '%')}&mc=${merchantCategoryCode}&url=${successUrl}`;

        console.log("Generated UPI Intent URL:", upiIntentUrl);

        const pendingTransaction = {
            id: transactionId,
            type: 'expense',
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            status: 'pending'
        };

        saveTransaction(pendingTransaction);
        localStorage.setItem('pending_upi_confirmation', JSON.stringify(pendingTransaction));
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

    toggleFlashButton.addEventListener('click', () => {
        if (videoTrack) {
            const imageCapture = new ImageCapture(videoTrack);
            imageCapture.getPhotoCapabilities()
                .then(capabilities => {
                    if (capabilities.torch) {
                        flashEnabled =!flashEnabled;
                        videoTrack.applyConstraints({ advanced: [{ torch: flashEnabled }] })
                            .then(() => {
                                toggleFlashButton.textContent = flashEnabled? 'Disable Flash' : 'Enable Flash';
                            })
                            .catch(err => {
                                console.error('Error toggling flash:', err);
                                alert('Error toggling flash.');
                            });
                    } else {
                        alert('Flash control is not supported on this device.');
                    }
                })
                .catch(err => {
                    console.error('Error getting camera capabilities:', err);
                    alert('Error accessing camera capabilities.');
                });
        }
    });
});