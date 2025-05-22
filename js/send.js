document.addEventListener('DOMContentLoaded', () => {
    // Set initial focus and selection on the amount input field
    setTimeout(() => {
        const input = document.getElementById("amount");
        if (input) { // Check if input exists before focusing
            input.focus();
            input.select(); // optional: selects the input text
        }
    }, 300); // Small delay to ensure mobile keyboard shows

    // --- DOM Elements ---
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
    // Get the switch and the details container for Send page
    const toggleDetailsSwitch = document.getElementById('toggleDetails'); // Correct variable name
    const detailsFields = document.getElementById('detailsFields'); // Correct variable name
    const amountErrorDisplay = document.getElementById('sendAmountError'); // Get the error span for send page

    // --- State Variables ---
    let flashEnabled = false;
    let html5QrCode = null; // Holds the Html5Qrcode instance
    let qrCodeDetected = false; // Flag to ensure QR code is processed only once
    let currentCameraCapabilities = null; // Stores camera capabilities (zoom, torch, etc.)
    let amount = 0; // Declare amount here to make it accessible to initiateUpiPayment

    // Variables to hold data extracted from QR code for confirmation
    let currentExtractedUPIID = null;
    let currentExtractedMerchantName = null;


    // Define Html5QrcodeScannerState (assuming it's not globally available, common for Html5Qrcode)
    const Html5QrcodeScannerState = {
        NOT_STARTED: 0,
        SCANNING: 1,
        PAUSED: 2,
        STOPPED: 3
    };


    // --- Helper Functions (Defined once in global scope) ---

    // Ensure these category elements actually exist in your full send.html if you want them
    function getSelectedCategory() {
        if (categoryFood && categoryFood.checked) return 'food';
        if (categoryShopping && categoryShopping.checked) return 'shopping';
        if (categoryEntertainment && categoryEntertainment.checked) return 'entertainment';
        if (categoryTravel && categoryTravel.checked) return 'travel';
        if (categoryOthers && categoryOthers.checked) return 'others';
        return '';
    }

    // function generateUniqueId() { // Will use global version from script.js
    //     return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // }

    function saveTransaction(transaction) {
        let transactions = getParsedLocalStorageItem('earn_transactions', []);
        transactions.unshift(transaction); // Add to the beginning of the array
        if (!setLocalStorageItem('earn_transactions', JSON.stringify(transactions))) {
            alert("Failed to save transaction. Please try again.");
            return false;
        }
        return true;
    }

    function extractDataFromQRCode(qrCodeText) {
        let upiId = null;
        let merchantName = null;

        if (!qrCodeText || !qrCodeText.startsWith("upi://pay?")) {
            return { upiId: null, merchantName: null };
        }

        const queryString = qrCodeText.substring(qrCodeText.indexOf("?") + 1);
        const params = {};
        
        queryString.split('&').forEach(paramPair => {
            const parts = paramPair.split('=');
            if (parts.length === 2) {
                params[parts[0].toLowerCase()] = parts[1]; // Use toLowerCase for keys for case-insensitivity
            } else if (parts.length === 1 && parts[0].length > 0) {
                // Handle case where a parameter might not have a value, though less common in UPI
                params[parts[0].toLowerCase()] = ""; 
            }
        });

        if (params['pa']) {
            try {
                upiId = decodeURIComponent(params['pa']);
            } catch (e) {
                console.error("Error decoding UPI ID (pa):", e);
                upiId = null; // Or handle as invalid
            }
        }

        if (params['pn']) {
            try {
                merchantName = decodeURIComponent(params['pn'].replace(/\+/g, ' '));
            } catch (e) {
                console.error("Error decoding Payee Name (pn):", e);
                merchantName = null; // Or handle as invalid
            }
        }

        let amountVal = null;
        if (params['am']) {
            const parsedAmount = parseFloat(params['am']);
            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                amountVal = parsedAmount.toFixed(2);
            } else {
                console.warn("Invalid or zero amount found in QR (am):", params['am']);
            }
        }

        let transactionNote = null;
        if (params['tn']) {
            try {
                transactionNote = decodeURIComponent(params['tn'].replace(/\+/g, ' '));
            } catch (e) {
                console.error("Error decoding Transaction Note (tn):", e);
                transactionNote = null; // Or handle as invalid
            }
        }
        
        return { upiId, merchantName, amount: amountVal, transactionNote };
    }

    function initiateUpiPayment(recipientVPA, paymentAmount, description, category, merchantNameFromQR) {
        const transactionId = generateUniqueId();
        // Use merchantName from QR if available, otherwise default or use stored username
        const payeeName = merchantNameFromQR || getLocalStorageItem('earn_username') || 'Recipient Name';
        const merchantCategoryCode = '0000'; // Generic MCC for now

        // Dynamically construct the success URL using window.location.origin
        const successUrl = encodeURIComponent(`${window.location.origin}/index.html?status=success&transactionId=${transactionId}`);

        let encodedDescription = encodeURIComponent(description);
        // Replace spaces with '+' for proper URL encoding in UPI intent (some apps prefer +)
        encodedDescription = encodedDescription.replace(/%20/g, '+');

        // Construct the UPI Intent URL
        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(recipientVPA)}&pn=${encodeURIComponent(payeeName)}&am=${parseFloat(paymentAmount).toFixed(2)}&cu=INR&tr=${encodeURIComponent(transactionId)}&tn=${encodedDescription}&mc=${merchantCategoryCode}&url=${successUrl}`;

        console.log("DEBUG (send.js): Generated UPI Intent URL:", upiIntentUrl);

        // Save a pending transaction to local storage
        const pendingTransaction = {
            id: transactionId,
            type: 'expense',
            amount: parseFloat(paymentAmount),
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            status: 'pending', // Mark as pending until confirmed by UPI app callback
            merchantName: merchantNameFromQR // ADD THIS LINE to save merchant name
        };

        if (!saveTransaction(pendingTransaction)) {
            alert("Failed to save pending transaction locally. Aborting UPI payment.");
            return; // Do not proceed
        }
        console.log("DEBUG (send.js): Saved pending transaction to earn_transactions:", pendingTransaction);

        // Redirect to the UPI application
        window.location.href = upiIntentUrl;
    }

    // --- QR Scanner Control Functions ---

    function startQrScanner() {
        qrScannerView.innerHTML = ''; // Clear previous content in scanner view
        qrCodeDetected = false;

        // Clear any previous Html5Qrcode instance to prevent conflicts
        if (html5QrCode) {
            html5QrCode.clear().catch(err => console.error("Error clearing old Html5Qrcode instance:", err));
        }
        html5QrCode = new Html5Qrcode("qrScannerView"); // Initialize a new Html5Qrcode instance

        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            if (!qrCodeDetected) { // Ensure QR code is processed only once
                qrCodeDetected = true;
                // Stop the camera immediately after a successful scan
                html5QrCode.stop().then(() => {
                    qrScannerPopup.style.display = 'none'; // Hide the scanner popup

                    const qrData = extractDataFromQRCode(decodedText);
                    currentExtractedUPIID = qrData.upiId;
                    currentExtractedMerchantName = qrData.merchantName;

                    // Handle amount from QR
                    if (qrData.amount && amountInput) {
                        const parsedAmount = parseFloat(qrData.amount);
                        if (!isNaN(parsedAmount) && parsedAmount > 0) {
                            amountInput.value = parsedAmount.toFixed(2);
                            amount = parsedAmount; // Update global amount
                            amountInput.readOnly = true;
                        } else {
                            amountInput.readOnly = false; // Ensure editable if QR amount is invalid
                        }
                    } else if (amountInput) {
                        amountInput.readOnly = false; // Ensure editable if no amount in QR
                    }
                    
                    // Handle transaction note (description) from QR
                    if (qrData.transactionNote && descriptionInput) {
                        descriptionInput.value = qrData.transactionNote;
                        // If description is pre-filled, ensure details section is visible
                        if (toggleDetailsSwitch && detailsFields) {
                            toggleDetailsSwitch.checked = true;
                            detailsFields.classList.remove('hidden');
                        }
                    }

                    // Get current category and description from the form (description might have been updated)
                    const currentDescription = descriptionInput ? descriptionInput.value : '';
                    const currentCategory = toggleDetailsSwitch && toggleDetailsSwitch.checked ? getSelectedCategory() : '';
                    
                    // The global 'amount' is either from QR or will be taken from amountInput in sendForm submit if not set by QR.
                    // For direct initiation, ensure 'amount' variable is correctly set if QR had it.
                    // If not set by QR, it should be the value from the form (which is handled by sendForm submit listener).
                    // Here, we prioritize QR amount if present.
                    const paymentAmount = qrData.amount ? parseFloat(qrData.amount) : parseFloat(amountInput.value);


                    if (currentExtractedUPIID) {
                        // Directly initiate UPI payment
                        initiateUpiPayment(currentExtractedUPIID, paymentAmount, currentDescription, currentCategory, currentExtractedMerchantName);
                    } else {
                        alert('Invalid UPI QR code. No UPI ID found.');
                        if (amountInput) amountInput.readOnly = false; // Reset readOnly status
                        // Optionally, restart scanner here if it was an invalid QR and user wants to try again
                        // qrScannerPopup.style.display = 'block';
                        // startQrScanner();
                    }
                }).catch(err => {
                    console.error("Error stopping QR scanner after success:", err);
                    // Provide more specific error message to the user
                    alert(`Error processing QR code after scan: ${err.message || 'An unexpected error occurred while stopping the camera.'}`);
                });
            }
        };

        // Get available camera devices
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0) {
                // Prioritize the back/rear camera for better scanning
                const rearCamera = devices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear'));
                const cameraId = rearCamera ? rearCamera.id : devices[0].id; // Fallback to first camera if no rear found

                const config = {
                    fps: 20, // Frames per second for scanning (good balance of performance and accuracy)
                    // Make qrbox responsive to the viewfinder dimensions
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        let minEdgePercentage = 0.7; // 70% of the smaller edge
                        let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight) * minEdgePercentage;
                        return { width: minEdgeSize, height: minEdgeSize };
                    },
                    videoConstraints: {
                        facingMode: "environment", // Request the environment (back) camera
                    }
                };

                // Start the QR scanner
                html5QrCode.start(cameraId, config, qrCodeSuccessCallback)
                    .then(() => {
                        console.log('QR scanner started successfully.');
                        // --- IMPORTANT: Get capabilities and apply zoom/torch synchronously ---
                        const capabilities = html5QrCode.getRunningTrackCapabilities();
                        currentCameraCapabilities = capabilities; // Store capabilities for flash button

                        // Apply zoom if supported by the camera
                        if (capabilities.zoom) {
                            // Calculate a reasonable desired zoom level (e.g., min + 2.0 or capped at max)
                            // Adjust '2.0' based on testing for optimal distance scanning
                            const desiredZoom = Math.min(capabilities.zoom.max || 1.0, capabilities.zoom.min + 2.0);
                            html5QrCode.applyVideoConstraints({ advanced: [{ zoom: desiredZoom }] })
                                .then(() => console.log(`Applied zoom: ${desiredZoom}`))
                                .catch(err => console.warn('Could not apply zoom:', err.message));
                        } else {
                            console.warn('Zoom not supported by this camera or browser.');
                        }

                        // Show/hide flash button based on torch support
                        if (capabilities.torch) {
                            toggleFlashButton.style.display = 'block';
                        } else {
                            toggleFlashButton.style.display = 'none';
                        }
                    })
                    .catch(err => {
                        console.error('Error starting QR scanner:', err);
                        alert('Error starting QR scanner. Please ensure camera permissions are granted and try again.');
                    });
            } else {
                alert("No cameras found on this device.");
            }
        }).catch(err => {
            console.error("Error getting camera devices:", err);
            alert("Error getting camera devices. Please ensure camera permissions are granted.");
        });
    }

    // --- Event Listeners ---

    // Load and apply the saved details switch state from local storage
    const savedDetailsState = getLocalStorageItem('hideDetails'); // Use 'hideDetails' for unified switch
    // Standard: 'true' means hide, 'false' means show. Default to HIDE if not set.
    // So, showDetails is true ONLY if savedDetailsState is explicitly 'false'.
    const showDetails = savedDetailsState === 'false'; 

    if (toggleDetailsSwitch) {
        toggleDetailsSwitch.checked = showDetails;
    }
    if (detailsFields) {
        // If showDetails is true, 'hidden' class should NOT be there (so, !showDetails is false).
        // If showDetails is false, 'hidden' class SHOULD be there (so, !showDetails is true).
        detailsFields.classList.toggle('hidden', !showDetails);
    }


    // Event listener for the toggle switch to show/hide details fields
    if (toggleDetailsSwitch && detailsFields) {
        toggleDetailsSwitch.addEventListener('change', () => {
            const currentState = toggleDetailsSwitch.checked;
            detailsFields.classList.toggle('hidden', !currentState);
            // Save the state as 'true' if checked (show details), 'false' if unchecked (hide details)
            // The key 'hideDetails' means: true if details are hidden, false if details are shown.
            // So, if currentState is true (details shown), we save 'false' to 'hideDetails'.
            // If currentState is false (details hidden), we save 'true' to 'hideDetails'.
            if (!setLocalStorageItem('hideDetails', (!currentState).toString())) {
                alert("Could not save your preference for showing/hiding details.");
            }
        });
    }


    // Event listener for the form submission (initiates QR scan)
    if (sendForm) {
        sendForm.addEventListener('submit', (event) => {
            event.preventDefault();

            amount = parseFloat(amountInput.value); // Assign to the outer 'amount' variable
            
            if (isNaN(amount) || amount <= 0) {
                if (amountErrorDisplay) {
                    amountErrorDisplay.textContent = 'Please enter a valid positive amount.';
                    amountErrorDisplay.style.display = 'block';
                } else {
                    alert('Please enter a valid amount.'); // Fallback
                }
                return;
            } else if (amountErrorDisplay) {
                amountErrorDisplay.textContent = '';
                amountErrorDisplay.style.display = 'none';
            }

            qrScannerPopup.style.display = 'block'; // Show QR scanner popup
            startQrScanner(); // Start the QR scanner
        });
    } else {
        console.warn("Send form not found in send.html.");
    }


    // Event listener to close the QR scanner popup
    if (closeScannerButton) {
        closeScannerButton.addEventListener('click', () => {
            qrScannerPopup.style.display = 'none'; // Hide the popup
            if (html5QrCode && html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) { // Only stop if scanning
                html5QrCode.stop().then(() => { // Stop the camera stream
                    html5QrCode.clear(); // Clear the Html5Qrcode instance
                    html5QrCode = null; // Reset the instance
                    flashEnabled = false; // Reset flash state
                    if(toggleFlashButton) toggleFlashButton.textContent = 'Enable Flash'; // Reset button text
                    if(toggleFlashButton) toggleFlashButton.style.display = 'none'; // Hide flash button
                }).catch(err => console.error("Error stopping or clearing Html5Qrcode on close:", err));
            }
            if (amountInput) amountInput.readOnly = false; // Reset amount field to editable
            qrCodeDetected = false; // Reset QR detection flag
        });
    } else {
        console.warn("Close scanner button not found in send.html.");
    }


    // Event listener for adding a manual expense
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            const manualExpenseAmount = parseFloat(amountInput.value);
            // Use toggleDetailsSwitch directly here
            const manualExpenseDescription = toggleDetailsSwitch && toggleDetailsSwitch.checked ? descriptionInput.value : '';
            const manualExpenseCategory = toggleDetailsSwitch && toggleDetailsSwitch.checked ? getSelectedCategory() : '';

            if (isNaN(manualExpenseAmount) || manualExpenseAmount <= 0) {
                if (amountErrorDisplay) {
                    amountErrorDisplay.textContent = 'Please enter a valid positive amount.';
                    amountErrorDisplay.style.display = 'block';
                } else {
                    alert('Please enter a valid expense amount.'); // Fallback
                }
                return;
            } else if (amountErrorDisplay) {
                amountErrorDisplay.textContent = '';
                amountErrorDisplay.style.display = 'none';
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

            if (saveTransaction(newExpenseTransaction)) {
                console.log("DEBUG (send.js): Saved manual expense to earn_transactions:", newExpenseTransaction);
                window.location.href = 'index.html'; // Redirect to index page after saving
            } else {
                // Alert is handled by saveTransaction, so just prevent redirection.
            }
        });
    } else {
        console.warn("Add expense button not found in send.html.");
    }


    // Event listener for the flashlight toggle button
    if (toggleFlashButton) {
        toggleFlashButton.addEventListener('click', () => {
            // Check if html5QrCode instance exists and is currently scanning
            if (html5QrCode && html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
                // Get current camera capabilities (synchronous)
                const capabilities = html5QrCode.getRunningTrackCapabilities();
                currentCameraCapabilities = capabilities; // Update capabilities (though likely already current)

                if (capabilities.torch) { // Check if torch (flashlight) is supported
                    flashEnabled = !flashEnabled; // Toggle flash state
                    html5QrCode.applyVideoConstraints({ advanced: [{ torch: flashEnabled }] })
                        .then(() => {
                            toggleFlashButton.textContent = flashEnabled ? 'Disable Flash' : 'Enable Flash';
                            console.log(`Flash ${flashEnabled ? 'enabled' : 'disabled'}`);
                        })
                        .catch(err => {
                            console.error('Error toggling flash:', err);
                            alert('Error toggling flash. Ensure camera permissions are granted and device supports it.');
                        });
                } else {
                    alert('Flash control is not supported on this device or current camera.');
                }
            } else {
                alert('QR scanner is not active to toggle flash.');
            }
        });
    } else {
        console.warn("Toggle flash button not found in send.html.");
    }

});
