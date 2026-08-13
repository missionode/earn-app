// quickscan.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: quickscan.js loaded.");

    const qrVideo = document.getElementById('qr-video');
    const qrCanvas = document.getElementById('qr-canvas');
    const videoContainer = document.getElementById('video-container');
    const scanStatus = document.getElementById('scan-status');
    const launchButton = document.getElementById('quickscan-launch');
    const launchHelp = document.getElementById('quickscan-launch-help');
    const canvasContext = qrCanvas.getContext('2d', { willReadFrequently: true });
    let cameraStream = null;
    let scanComplete = false;
    let paymentAppWasOpened = false;

    // Check if UPI ID is set in localStorage
    const userUpiId = localStorage.getItem('earn_upiId');
    const username = localStorage.getItem('earn_username');

    if (!userUpiId || !username) {
        console.log("DEBUG: UPI ID or username not set. Redirecting to index.html.");
        alert('Please set up your UPI ID and username first.');
        window.location.href = 'index.html?triggerUPIPopUp=true';
        return; // Stop execution if redirecting
    }

    // Attempt to access the camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
            cameraStream = stream;
            qrVideo.srcObject = stream;
            qrVideo.setAttribute('playsinline', true); // Required for iOS
            qrVideo.play();
            requestAnimationFrame(tick);
            console.log("DEBUG: Camera stream started.");
        })
        .catch((err) => {
            console.error("ERROR: Could not access camera:", err);
            scanStatus.textContent = 'Error: Could not access camera. Please ensure camera permissions are granted.';
            alert('Error: Could not access your device camera. Please check camera permissions in your browser settings.');
        });

    function tick() {
        if (scanComplete) return;

        if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
            qrCanvas.hidden = false;
            qrCanvas.height = qrVideo.videoHeight;
            qrCanvas.width = qrVideo.videoWidth;
            canvasContext.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);

            const imageData = canvasContext.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
            // jsQR is expected to be globally available from the script tag in quickscan.html
            // If jsQR is not defined, ensure you have included it correctly (e.g., <script src="js/jsQR.min.js"></script>)
            if (typeof jsQR !== 'function') {
                console.error("ERROR: jsQR library not found. Please ensure jsQR.min.js is included in quickscan.html.");
                scanStatus.textContent = 'Error: QR scanner library not loaded.';
                return; // Stop scanning if library is missing
            }

            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                // QR code detected
                const qrData = code.data;
                console.log("DEBUG: QR Code detected:", qrData);
                
                // Attempt to parse the QR data as a UPI URL
                if (qrData.toLowerCase().startsWith('upi://pay')) {
                    handleUpiUrl(qrData);
                    return; // Stop processing further frames after successful scan
                } else if (qrData.includes('@')) { // Simple check for UPI ID format
                    // Assume it's a raw UPI ID if it contains '@'
                    const sellerUpiId = qrData;
                    const defaultNote = 'Quick Scan Payment'; // Default note
                    const upiUrl = `upi://pay?pa=${encodeURIComponent(sellerUpiId)}&pn=${encodeURIComponent('Seller')}&cu=INR&tn=${encodeURIComponent(defaultNote)}`;
                    handleUpiUrl(upiUrl);
                    return; // Stop processing further frames after successful scan
                } else {
                    scanStatus.textContent = `Invalid QR: "${qrData}". Please scan a UPI QR code.`;
                }
            } else {
                scanStatus.textContent = 'Scanning... No QR code detected.';
            }
        }
        requestAnimationFrame(tick); // Continue scanning
    }

    function handleUpiUrl(upiUrl) {
        try {
            window.EarnUpi.parseUpiPaymentUri(upiUrl);
        } catch (error) {
            scanStatus.textContent = error.message;
            return;
        }

        scanComplete = true;
        scanStatus.textContent = 'QR code scanned. Tap below to open your UPI app.';
        launchButton.href = upiUrl;
        launchButton.hidden = false;
        launchHelp.hidden = false;
        videoContainer.hidden = true;

        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        qrVideo.srcObject = null;
    }

    launchButton.addEventListener('click', (event) => {
        if (!launchButton.getAttribute('href')) {
            event.preventDefault();
            return;
        }

        paymentAppWasOpened = true;
        scanStatus.textContent = 'Opening your UPI app…';
    });

    document.addEventListener('visibilitychange', () => {
        if (paymentAppWasOpened && document.visibilityState === 'visible') {
            scanStatus.textContent = 'Returned from the UPI app. If it only unlocked, tap Open UPI app again.';
        }
    });

    window.addEventListener('pagehide', () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
    });
});
