document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('upload-status');
    const backupButton = document.getElementById('backupButton');
    const backupStatus = document.getElementById('backup-status');

    uploadForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (file) {
            uploadStatus.textContent = 'Uploading...';
            uploadStatus.classList.remove('hidden');

            const formData = new FormData();
            formData.append('csvFile', file);

            // Replace '/upload-data' with your actual server endpoint for file upload
            fetch('/upload-data', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.text())
            .then(data => {
                uploadStatus.textContent = data; // Display server response
                if (data.includes('successful')) {
                    uploadStatus.classList.add('success'); // You'll need to define this class in CSS
                } else {
                    uploadStatus.classList.add('error'); // You'll need to define this class in CSS
                }
            })
            .catch(error => {
                console.error('Upload error:', error);
                uploadStatus.textContent = 'Upload failed.';
                uploadStatus.classList.add('error');
            });
        } else {
            uploadStatus.textContent = 'Please select a CSV file.';
            uploadStatus.classList.remove('hidden');
            uploadStatus.classList.add('error');
        }
    });

    backupButton.addEventListener('click', () => {
        backupStatus.textContent = 'Initiating backup...';
        backupStatus.classList.remove('hidden');

        // Replace '/backup-data' with your actual server endpoint for backup
        fetch('/backup-data', {
            method: 'POST',
        })
        .then(response => response.text())
        .then(data => {
            backupStatus.textContent = data; // Display server response
            if (data.includes('successful')) {
                backupStatus.classList.add('success'); // You'll need to define this class in CSS
            } else {
                backupStatus.classList.add('error'); // You'll need to define this class in CSS
            }
        })
        .catch(error => {
            console.error('Backup error:', error);
            backupStatus.textContent = 'Backup failed.';
            backupStatus.classList.add('error');
        });
    });
});
