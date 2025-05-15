if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('js/sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

let deferredPrompt;
const installPrompt = document.createElement('div');
installPrompt.id = 'installPrompt';
installPrompt.style.display = 'none'; // Initially hidden

const appLogo = document.createElement('img');
appLogo.src = './assets/icons/icon-96x96.png'; // Adjust path if needed
appLogo.alt = 'Earn App Logo';
appLogo.classList.add('install-logo');

const appName = document.createElement('h3');
appName.textContent = 'Install Earn App';

const appDescription = document.createElement('p');
appDescription.textContent = 'Add Earn to your home screen for quick access.';

const installButton = document.createElement('button');
installButton.textContent = 'Install';
installButton.classList.add('button', 'primary', 'install-button');
installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installPrompt.style.display = 'none'; // Hide the prompt after interaction
    }
});

const closeButton = document.createElement('button');
closeButton.textContent = 'Close';
closeButton.classList.add('button', 'secondary', 'install-close-button');
closeButton.addEventListener('click', () => {
    installPrompt.style.display = 'none'; // Hide the prompt if closed
});

installPrompt.appendChild(appLogo);
installPrompt.appendChild(appName);
installPrompt.appendChild(appDescription);
installPrompt.appendChild(installButton);
installPrompt.appendChild(closeButton);
document.body.appendChild(installPrompt);

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;
    // Show your custom install prompt after a delay or based on user interaction
    setTimeout(() => {
        if (!isAppInstalled()) { // Check if already installed (optional)
            installPrompt.style.display = 'block';
            // Add a subtle animation class
            installPrompt.classList.add('show-install-prompt');
        }
    }, 3000); // Show after 3 seconds (adjust as needed)
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    installPrompt.style.display = 'none'; // Ensure prompt is hidden after install
});

// Optional: Function to check if the app is already installed
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.getInstalledRelatedApps().then((relatedApps) => relatedApps.length > 0);
}
