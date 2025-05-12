document.addEventListener('DOMContentLoaded', () => {
    // This ensures the code runs after the entire HTML document is loaded.

    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('upload-status');
    const backupButton = document.getElementById('backupButton');
    const backupStatus = document.getElementById('backup-status');

    // Get references to HTML elements using their IDs. These are likely elements
    // on your 'data.html' page for the file upload and backup sections.

    uploadForm.addEventListener('submit', (event) => {
        // This adds an event listener that will execute a function when the
        // 'uploadForm' is submitted.

        event.preventDefault();
        // This prevents the default form submission behavior, which would typically
        // cause the page to reload. We want to handle the submission with JavaScript.

        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        // Gets a reference to the file input element and retrieves the first
        // selected file (assuming the user selects only one).

        if (file) {
            // Checks if a file has been selected by the user.

            uploadStatus.textContent = 'Uploading...';
            uploadStatus.classList.remove('hidden');
            // Updates the text content of the 'uploadStatus' element to indicate
            // that the upload is in progress and makes the element visible.

            const formData = new FormData();
            formData.append('csvFile', file);
            // Creates a 'FormData' object, which is used to send data (including files)
            // to the server via HTTP. The selected file is appended to this object
            // with the field name 'csvFile'.

            fetch('/upload-data', {
                method: 'POST',
                body: formData,
            })
            // Initiates an HTTP 'POST' request to the URL '/upload-data'. The
            // 'FormData' object containing the file is sent in the request body.
            // 'fetch' returns a Promise that resolves to the response.

            .then(response => response.text())
            // Once the server responds, this part of the Promise chain takes the
            // response object and extracts its body as text. It returns another Promise.

            .then(data => {
                uploadStatus.textContent = data; // Display server response
                if (data.includes('successful')) {
                    uploadStatus.classList.add('success');
                } else {
                    uploadStatus.classList.add('error');
                }
            })
            // This part receives the text data from the server's response. It updates
            // the 'uploadStatus' element with this data and adds either a 'success'
            // or 'error' CSS class to style the message based on the server's reply.

            .catch(error => {
                console.error('Upload error:', error);
                uploadStatus.textContent = 'Upload failed.';
                uploadStatus.classList.add('error');
            });
            // This part catches any errors that occurred during the 'fetch' request
            // (e.g., network issues). It logs the error to the console and updates
            // the 'uploadStatus' to indicate failure.
        } else {
            uploadStatus.textContent = 'Please select a CSV file.';
            uploadStatus.classList.remove('hidden');
            uploadStatus.classList.add('error');
            // If no file was selected, it displays an error message to the user.
        }
    });

    backupButton.addEventListener('click', () => {
        // This adds an event listener that will execute a function when the
        // 'backupButton' is clicked.

        backupStatus.textContent = 'Initiating backup...';
        backupStatus.classList.remove('hidden');
        // Updates the text content of the 'backupStatus' element to indicate
        // that the backup process has started and makes it visible.

        fetch('/backup-data', {
            method: 'POST',
        })
        // Initiates an HTTP 'POST' request to the URL '/backup-data' to trigger
        // a backup operation on the server.

        .then(response => response.text())
        // Once the server responds, this extracts the response body as text.

        .then(data => {
            backupStatus.textContent = data; // Display server response
            if (data.includes('successful')) {
                backupStatus.classList.add('success');
            } else {
                backupStatus.classList.add('error');
            }
        })
        // Updates the 'backupStatus' element with the server's response and applies
        // CSS classes based on whether the response indicates success or failure.

        .catch(error => {
            console.error('Backup error:', error);
            backupStatus.textContent = 'Backup failed.';
            backupStatus.classList.add('error');
        });
        // Handles any errors during the backup request.
    });
});
