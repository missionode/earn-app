/**
 * @file send.js - Handles expense sending with manual entry and QR code scanning (Flash support improved).
 * @author Your Name & Gemini AI Collaboration
 * @version 1.3 (Flash Handling Enhancement)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Focus ---
    setTimeout(() => {
        document.getElementById("amount")?.focus();
        document.getElementById("amount")?.select();
    }, 300);

    // --- DOM Element References ---
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
    const scannerOverlay = document.getElementById('scannerOverlay');
    const errorMessage = document.getElementById('errorMessage');

    // --- State Variables ---
    let flashEnabled = false;
    let videoTrack = null;
    let html5QrCode = null;
    let qrCodeDetected = false;
    let lastDetectedTime = 0;

    // --- Unified Details Toggle ---
    const hideDetailsState = localStorage.getItem('hideDetails');
    const showDetails = hideDetailsState === null ? true : hideDetailsState === 'true';
    toggleDetailsSwitch.checked = showDetails;
    detailsFields.classList.toggle('hidden', !showDetails);

    toggleDetailsSwitch.addEventListener('change', () => {
        const currentState = toggleDetailsSwitch.checked;
        detailsFields.classList.toggle('hidden', !currentState);
        localStorage.setItem('hideDetails', currentState);
    });

    // --- Form Submission (Manual Entry) ---
    sendForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            showError('Please enter a valid amount.');
            return;
        }
        qrScannerPopup.style.display = 'block';
        startQrScanner();
    });

    // --- Close QR Scanner ---
    closeScannerButton.addEventListener('click', () => {
        qrScannerPopup.style.display = 'none';
        stopQrScanner();
        errorMessage.style.display = 'none';
    });

    // --- Add Expense (Manual) ---
    addExpenseBtn.addEventListener('click', () => {
        const manualExpenseAmount = parseFloat(amountInput.value);
        const manualExpenseDescription = toggleDetailsSwitch.checked ? descriptionInput.value : '';
        const manualExpenseCategory = toggleDetailsSwitch.checked ? getSelectedCategory() : '';

        if (isNaN(manualExpenseAmount) || manualExpenseAmount <= 0) {
            showError('Please enter a valid expense amount.');
            return;
        }

        const newExpenseTransaction = createExpenseTransaction(
            manualExpenseAmount,
            manualExpenseCategory,
            manualExpenseDescription,
            'success'
        );

        saveTransaction(newExpenseTransaction);
        window.location.href = 'index.html';
    });

    // --- Category Selection Helper ---
    function getSelectedCategory() {
        if (categoryFood?.checked) return 'food';
        if (categoryShopping?.checked) return 'shopping';
        if (categoryEntertainment?.checked) return 'entertainment';
        if (categoryTravel?.checked) return 'travel';
        if (categoryOthers?.checked) return 'others';
        return '';
    }

    // --- QR Scanner Initialization and Handling ---
    function startQrScanner() {
        qrScannerView.innerHTML = '';
        qrCodeDetected = false;
        html5QrCode = new Html5Qrcode("qrScannerView");

        scannerOverlay.classList.add('loading');
        errorMessage.style.display = 'none';

        const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
            const now = Date.now();
            if (!qrCodeDetected && now - lastDetectedTime > 1000) {
                qrCodeDetected = true;
                lastDetectedTime = now;
                scannerOverlay.classList.add('success');
                if (navigator.vibrate) navigator.vibrate(200);

                await new Promise(resolve => setTimeout(resolve, 500));

                stopQrScanner();
                qrScannerPopup.style.display = 'none';

                const qrData = extractDataFromQRCode(decodedText);
                if (qrData?.upiId) {
                    const category = toggleDetailsSwitch.checked ? getSelectedCategory() : '';
                    const description = toggleDetailsSwitch.checked ? descriptionInput.value : '';
                    initiateUpiPayment(qrData.upiId, amountInput.value, description, category, qrData.merchantName);
                } else {
                    showError('Invalid UPI QR code.');
                    qrCodeDetected = false;
                    scannerOverlay.classList.remove('success');
                }
            }
        };

        Html5Qrcode.getCameras().then(devices => {
            if (devices?.length > 0) {
                const rearCamera = devices.find(device => /back|rear/i.test(device.label));
                const cameraId = rearCamera?.id || devices[0].id;
                localStorage.setItem('preferredCameraId', cameraId);

                const config = {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    videoConstraints: {
                        facingMode: "environment",
                        advanced: [{ zoom: 1.5 }]
                    },
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };

                html5QrCode.start(cameraId, config, qrCodeSuccessCallback)
                    .then(() => {
                        scannerOverlay.classList.remove('loading');
                        try {
                            videoTrack = html5QrCode.getRunningTrack();
                            toggleFlashButton.disabled = !videoTrack;
                            toggleFlashButton.textContent = videoTrack ? 'Enable Flash' : 'Flash Not Available';
                            toggleFlashButton.classList.remove('active');
                        } catch (error) {
                            console.warn("getRunningTrack not supported or failed:", error);
                            videoTrack = null;
                            toggleFlashButton.disabled = true;
                            toggleFlashButton.textContent = 'Flash Not Available';
                            toggleFlashButton.classList.remove('active');
                        }
                    })
                    .catch(async (err) => {
                        console.error('Error starting QR scanner:', err);
                        try {
                            if (html5QrCode) {
                                await html5QrCode.stop();
                                html5QrCode.clear();
                            }
                            await html5QrCode.start(cameraId, { fps: 15, qrbox: { width: 250, height: 250 } }, qrCodeSuccessCallback);
                            scannerOverlay.classList.remove('loading');
                            try {
                                videoTrack = html5QrCode.getRunningTrack();
                                toggleFlashButton.disabled = !videoTrack;
                                toggleFlashButton.textContent = videoTrack ? 'Enable Flash' : 'Flash Not Available';
                                toggleFlashButton.classList.remove('active');
                            } catch (error) {
                                console.warn("getRunningTrack not supported or failed in fallback:", error);
                                videoTrack = null;
                                toggleFlashButton.disabled = true;
                                toggleFlashButton.textContent = 'Flash Not Available';
                                toggleFlashButton.classList.remove('active');
                            }
                        } catch (err2) {
                            console.error('Error in fallback QR scanner:', err2);
                            showError('Unable to start QR scanner.');
                        }
                    });
            } else {
                showError('No cameras found on this device.');
            }
        }).catch(err => {
            console.error('Error getting camera devices:', err);
            showError('Error accessing camera.');
        });
    }

    function stopQrScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
                html5QrCode = null;
            }).catch(err => console.error("Error stopping QR scanner:", err));
        }
        scannerOverlay.classList.remove('loading', 'success');
        videoTrack = null; // Reset videoTrack on stop
        toggleFlashButton.disabled = true;
        toggleFlashButton.textContent = 'Enable Flash'; // Reset button text
        toggleFlashButton.classList.remove('active');
    }

    // --- QR Code Data Extraction ---
    function extractDataFromQRCode(qrCodeText) {
        const upiRegex = /pa=([^&]+)/;
        const nameRegex = /pn=([^&]+)/;
        const upiMatch = qrCodeText.match(upiRegex);
        const nameMatch = qrCodeText.match(nameRegex);

        return {
            upiId: upiMatch ? decodeURIComponent(upiMatch[1]) : null,
            merchantName: nameMatch ? decodeURIComponent(nameMatch[1]) : null,
        };
    }

    // --- UPI Payment Initiation ---
    function initiateUpiPayment(recipientVPA, amount, description, category, merchantNameFromQR) {
        const transactionId = generateUniqueId();
        const payeeName = merchantNameFromQR || localStorage.getItem('earn_username') || 'Recipient';
        const merchantCategoryCode = '0000';
        const successUrl = encodeURIComponent(`https://missionode.github.io/earn-app/index.html?status=success&transactionId=${transactionId}`);
        const encodedDescription = encodeURIComponent(description).replace(/%20/g, '%');
        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(recipientVPA)}&pn=${encodeURIComponent(payeeName)}&am=${parseFloat(amount).toFixed(2)}&cu=INR&tr=${encodeURIComponent(transactionId)}&tn=${encodedDescription}&mc=${merchantCategoryCode}&url=${successUrl}`;

        const pendingTransaction = createExpenseTransaction(
            parseFloat(amount),
            category,
            description,
            'pending',
            transactionId
        );

        saveTransaction(pendingTransaction);
        localStorage.setItem('pending_upi_confirmation', JSON.stringify(pendingTransaction));
        window.location.href = upiIntentUrl;
    }

    // --- Helper Function to Create Expense Transaction Object ---
    function createExpenseTransaction(amount, category = '', description = '', status = 'success', id = generateUniqueId()) {
        return {
            id,
            type: 'expense',
            amount,
            category,
            description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            status
        };
    }

    // --- Local Storage Management ---
    function saveTransaction(transaction) {
        const transactions = JSON.parse(localStorage.getItem('earn_transactions') || '[]');
        transactions.unshift(transaction);
        localStorage.setItem('earn_transactions', JSON.stringify(transactions));
    }

    function generateUniqueId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // --- Error Display ---
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }

    // --- Flash Toggle ---
    toggleFlashButton.addEventListener('click', async () => {
        if (!videoTrack) {
            showError('Camera not active or flash control not available.');
            return;
        }
        try {
            flashEnabled = !flashEnabled;
            await videoTrack.applyConstraints({ advanced: [{ torch: flashEnabled }] });
            toggleFlashButton.textContent = flashEnabled ? 'Disable Flash' : 'Enable Flash';
            toggleFlashButton.classList.toggle('active', flashEnabled);
        } catch (err) {
            console.error('Error toggling flash:', err);
            showError('Flash not supported on this device or browser.');
            flashEnabled = false;
            toggleFlashButton.classList.remove('active');
        }
    });

    // --- Pinch-to-Zoom and Tap-to-Focus ---
    let initialPinchDistance = null;
    qrScannerView.addEventListener('touchstart', (event) => {
        if (event.touches.length === 2) {
            initialPinchDistance = Math.hypot(
                event.touches[0].pageX - event.touches[1].pageX,
                event.touches[0].pageY - event.touches[1].pageY
            );
        } else if (event.touches.length === 1 && videoTrack) {
            const touchX = event.touches[0].clientX / qrScannerView.offsetWidth;
            const touchY = event.touches[0].clientY / qrScannerView.offsetHeight;
            videoTrack.applyConstraints({ advanced: [{ focusMode: 'once', focusPointX: touchX, focusPointY: touchY }] }).catch(err => {
                console.warn("Error applying tap-to-focus:", err);
            });
        }
    });

    qrScannerView.addEventListener('touchmove', (event) => {
        if (event.touches.length === 2 && initialPinchDistance !== null && videoTrack) {
            const currentPinchDistance = Math.hypot(
                event.touches[0].pageX - event.touches[1].pageX,
                event.touches[0].pageY - event.touches[1].pageY
            );
            const scaleFactor = currentPinchDistance / initialPinchDistance;
            const newZoom = Math.min(Math.max(scale * scaleFactor, 1), 3);
            videoTrack.applyConstraints({ advanced: [{ zoom: newZoom }] }).catch(err => {
                console.warn("Error applying pinch-to-zoom:", err);
            });
        }
    });

    qrScannerView.addEventListener('touchend', () => {
        initialPinchDistance = null;
    });
});