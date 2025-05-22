// Global JavaScript File

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}

function setLocalStorageItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        // Check if the error is a QuotaExceededError
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert("Could not save data. Storage might be full.");
        } else {
            alert("An unexpected error occurred while saving data.");
        }
        return false;
    }
}

function getParsedLocalStorageItem(key, defaultValue) {
    const itemString = localStorage.getItem(key);
    if (itemString === null) {
        return defaultValue;
    }
    try {
        return JSON.parse(itemString);
    } catch (e) {
        console.error("Error parsing localStorage item:", e);
        alert(`Data corruption detected for item '${key}'. Using default value.`);
        return defaultValue;
    }
}

function generateUniqueId() {
    // More robust version using timestamp
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// You can add more global functions here as needed

