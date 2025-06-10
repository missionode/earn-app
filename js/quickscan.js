// quickscan.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: quickscan.js loaded.");

    const qrVideo = document.getElementById('qr-video');
    const qrCanvas = document.getElementById('qr-canvas');
    const scanStatus = document.getElementById('scan-status');
    const canvasContext = qrCanvas.getContext('2d', { willReadFrequently: true });

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
                if (qrData.startsWith('upi://pay')) {
                    handleUpiUrl(qrData);
                    return; // Stop processing further frames after successful scan
                } else if (qrData.includes('@')) { // Simple check for UPI ID format
                    // Assume it's a raw UPI ID if it contains '@'
                    const sellerUpiId = qrData;
                    const defaultAmount = 0; // Default to 0 for a quick scan without amount
                    const defaultNote = 'Quick Scan Payment'; // Default note
                    const upiUrl = `upi://pay?pa=${sellerUpiId}&pn=${encodeURIComponent('Seller Name')}&am=${defaultAmount}&cu=INR&tn=${encodeURIComponent(defaultNote)}`;
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
        console.log("DEBUG: Opening UPI app with URL:", upiUrl);
        scanStatus.textContent = 'QR Code Scanned! Opening UPI app...';
        // This payment will not be tracked or stored in local storage
        window.location.href = upiUrl; 
        
        // Optionally, you might want to stop the camera stream after launching the UPI app
        if (qrVideo.srcObject) {
            qrVideo.srcObject.getTracks().forEach(track => track.stop());
        }
    }
});