// Global JavaScript File

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}

function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// You can add more global functions here as needed

