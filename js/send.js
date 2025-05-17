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

    let activeCameraId = null;
    let lastScanTime = 0;
    const scanDebounceDelay = 200; // milliseconds
    let scannerOverlay;
    let scanSuccessTimeout;
    let html5QrCode = null;
    let qrCodeDetected = false;

    // --- Unified Switch Logic ---
    const hideDetailsState = localStorage.getItem('hideDetails');
    const showDetails = hideDetailsState === null ? true : hideDetailsState === 'true';

    toggleDetailsSwitch.checked = showDetails;
    if (!showDetails) {
        detailsFields.classList.add('hidden');
    } else {
        detailsFields.classList.remove('hidden');
    }

    toggleDetailsSwitch.addEventListener('change', () => {
        const currentState = toggleDetailsSwitch.checked;
        detailsFields.classList.toggle('hidden', !currentState);
        localStorage.setItem('hideDetails', currentState);
    });
    // --- End Unified Switch Logic ---

    sendForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const amount = parseFloat(amountInput.value);
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
        stopQrScanner();
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
            status: 'success'
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

    function initializeScannerOverlay() {
        scannerOverlay = document.createElement('div');
        scannerOverlay.classList.add('qr-scanner-overlay');
        const laserLine = document.createElement('div');
        laserLine.classList.add('qr-scanner-laser');
        scannerOverlay.appendChild(laserLine);
        qrScannerView.appendChild(scannerOverlay);
    }

    function showSuccessAnimation() {
        const successIndicator = document.createElement('div');
        successIndicator.classList.add('qr-scan-success');
        successIndicator.innerHTML = '&#10004;'; // Checkmark
        qrScannerView.appendChild(successIndicator);
        clearTimeout(scanSuccessTimeout);
        scanSuccessTimeout = setTimeout(() => {
            if (successIndicator && successIndicator.parentNode) {
                successIndicator.parentNode.removeChild(successIndicator);
            }
        }, 1000);
    }

    function handleCameraStart() {
        const loadingIndicator = document.getElementById('qrScannerLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    function handleCameraError(err) {
        console.error('Camera error:', err);
        const loadingIndicator = document.getElementById('qrScannerLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        showNotification('Camera Error', 'Failed to access the camera.', 'error');
    }

    function showNotification(title, message, type = 'info') {
        // Implement your in-app notification logic here (e.g., toast or modal)
        alert(`${title}: ${message}`); // Placeholder
    }

    function startQrScanner() {
        qrScannerView.innerHTML = '<div id="qrScannerLoading">Loading Camera...</div>';
        qrCodeDetected = false;
        html5QrCode = new Html5Qrcode("qrScannerView");

        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            const currentTime = Date.now();
            if (!qrCodeDetected && (currentTime - lastScanTime > scanDebounceDelay)) {
                qrCodeDetected = true;
                lastScanTime = currentTime;
                stopQrScanner();
                qrScannerPopup.style.display = 'none';
                const qrData = extractDataFromQRCode(decodedText);
                extractedUPIID = qrData.upiId;
                extractedMerchantName = qrData.merchantName;
                if (extractedUPIID) {
                    const category = toggleDetailsSwitch.checked ? getSelectedCategory() : '';
                    const description = toggleDetailsSwitch.checked ? descriptionInput.value : '';
                    initiateUpiPayment(extractedUPIID, amount, description, category, extractedMerchantName);
                    showSuccessAnimation();
                    if ("vibrate" in navigator) {
                        navigator.vibrate(100);
                    }
                } else {
                    showNotification('QR Code Error', 'Invalid UPI QR code.', 'error');
                }
            }
        };

        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0) {
                const rearCamera = devices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear'));
                activeCameraId = rearCamera ? rearCamera.id : devices[0].id;
                const selectedDeviceId = activeCameraId; // Use the determined device ID

                const initialZoomFactor = 2.0;
                const preferredFps = 15;

                const config = {
                    deviceId: selectedDeviceId, // Directly pass deviceId
                    facingMode: rearCamera ? "environment" : undefined // Conditionally set facingMode
                };

                html5QrCode.start(config, qrCodeSuccessCallback, handleCameraError)
                    .then(() => {
                        handleCameraStart();
                        // Attempt to apply advanced constraints *after* starting
                        const advancedConstraints = { advanced: [{ zoom: initialZoomFactor }], frameRate: preferredFps };
                        html5QrCode.applyVideoConstraints(advancedConstraints)
                            .catch(err => {
                                console.warn("Error applying advanced video constraints (zoom/fps):", err);
                                // Continue even if applying advanced constraints fails (might not be supported)
                            });
                    })
                    .catch(err => {
                        console.error('Error starting QR scanner:', err);
                        handleCameraError(err);
                        // Fallback - try starting with facingMode only
                        html5QrCode.start({ facingMode: "environment", frameRate: 10 }, qrCodeSuccessCallback, handleCameraError)
                            .then(handleCameraStart)
                            .catch(err2 => {
                                console.error('Fallback error starting QR scanner:', err2);
                                handleCameraError(err2);
                            });
                    });

                initializeScannerOverlay();
            } else {
                showNotification('Camera Error', 'No cameras found on this device.', 'error');
            }
        }).catch(err => {
            console.error("Error getting camera devices:", err);
            showNotification('Camera Error', 'Error accessing camera devices.', 'error');
        });
    }

    function stopQrScanner() {
        if (html5QrCode) {
            html5QrCode.stop().catch(err => console.error("Error stopping QR scanner:", err));
            html5QrCode.clear();
            html5QrCode = null;
            qrCodeDetected = false;
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
        if (!html5QrCode) return;

        html5QrCode.isTorchOn().then(isTorchOn => {
            html5QrCode.toggleTorch().then(() => {
                toggleFlashButton.textContent = isTorchOn ? 'Enable Flash' : 'Disable Flash';
            }).catch(err => {
                console.error('Error toggling torch:', err);
                showNotification('Flash Error', 'Error toggling flash.', 'error');
            });
        }).catch(err => {
            console.error('Error checking torch status:', err);
            showNotification('Flash Error', 'Error checking flash status.', 'error');
        });
    });
});