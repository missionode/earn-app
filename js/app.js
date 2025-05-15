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
installPrompt.classList.add('install-prompt-container'); // Add a class for easier styling

const appLogo = document.createElement('img');
appLogo.src = './assets/icons/icon-96x96.png'; // Adjust path if needed
appLogo.alt = 'Earn App Logo';
appLogo.classList.add('install-logo');

const appInfo = document.createElement('div');
appInfo.classList.add('install-info');

const appName = document.createElement('h3');
appName.textContent = 'Install Earn App';

const appDescription = document.createElement('p');
appDescription.textContent = 'Add Earn to your home screen for quick access.';

appInfo.appendChild(appName);
appInfo.appendChild(appDescription);

const installButton = document.createElement('button');
installButton.textContent = 'Install';
installButton.classList.add('button', 'primary', 'install-button');
installButton.addEventListener('click', async () => {
    console.log('Install button clicked');
    if (deferredPrompt) {
        console.log('deferredPrompt is available');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installPrompt.style.display = 'none'; // Hide the prompt after interaction
    } else {
        console.log('deferredPrompt is null or undefined when install button clicked');
    }
});

const closeButton = document.createElement('button');
closeButton.textContent = 'Skip for Now';
closeButton.classList.add('button', 'secondary', 'install-close-button');
closeButton.addEventListener('click', () => {
    console.log('Close button clicked');
    installPrompt.style.display = 'none'; // Hide the prompt if closed
});

installPrompt.appendChild(appLogo);
installPrompt.appendChild(appInfo);
installPrompt.appendChild(installButton);
installPrompt.appendChild(closeButton);
document.body.appendChild(installPrompt);
console.log('installPrompt appended to body');

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;
    // Show your custom install prompt after a delay or based on user interaction
    setTimeout(() => {
        isAppInstalled().then(isInstalled => {
            console.log('isAppInstalled() resolved:', isInstalled);
            if (!isInstalled) {
                console.log('App is not installed, showing prompt');
                installPrompt.style.display = 'block';
                installPrompt.classList.add('show-install-prompt');
                console.log('installPrompt display set to block and show class added');
            } else {
                console.log('App is likely installed, not showing prompt');
            }
        });
    }, 2000); // Show after 2 seconds (slightly reduced delay)
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    installPrompt.style.display = 'none'; // Ensure prompt is hidden after install
});

// Optional: Function to check if the app is already installed
function isAppInstalled() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('Standalone check:', standalone);
    return navigator.getInstalledRelatedApps().then((relatedApps) => {
        const installed = relatedApps.length > 0;
        console.log('getInstalledRelatedApps check:', installed, relatedApps);
        return installed || standalone; // Include standalone check in the resolved value
    }).catch(error => {
        console.error('Error checking installed related apps:', error);
        return standalone; // Return standalone status on error
    });
}
