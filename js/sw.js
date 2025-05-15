const CACHE_NAME = 'earn-app-v9';
const urlsToCache = [
    '../', //Cache the root
    '../index.html',
    '../splash.html',
    '../receive.html',
    '../receive-qr.html',
    '../send.html',
    '../transactions.html',  // Added
    '../data.html',          // Added
    '../favicon.ico',      // Added
    '../css/styles.css',
    '../css/index.css',
    '../css/splash.css',
    '../css/receive.css',
    '../css/receive-qr.css',
    '../css/send.css',
    '../css/transactions.css', // Added
    '../css/data.css',     // Added
    '../js/script.js',
    '../js/index.js',
    '../js/splash.js',
    '../js/receive.js',
    '../js/receive-qr.js',
    '../js/send.js',
    '../js/transactions.js', // Added
    '../js/data.js',        // Added
    '../js/app.js',
    '../assets/images/logo.png',
    '../assets/images/logofull.svg', // Added
    '../assets/images/twct.png',    // Added
    '../assets/images/wwwc.png',    // Added
    '../assets/icons/Audit.svg',
    '../assets/icons/arrow-down-income.svg',
    '../assets/icons/arrow-down.svg',
    '../assets/icons/arrow-up-expense.svg',
    '../assets/icons/arrow-up.svg',
    '../assets/icons/cash.svg',
    '../assets/icons/default.svg',
    '../assets/icons/edit.svg',
    '../assets/icons/entertainment.svg',
    '../assets/icons/food.svg',
    '../assets/icons/home-back-arrow.gif',
    '../assets/icons/icon-144x144.png',
    '../assets/icons/icon-192x192.png',
    '../assets/icons/icon-40x40.png',
    '../assets/icons/icon-40x40.svg',
    '../assets/icons/icon-48x48.png',
    '../assets/icons/icon-512x512.png',
    '../assets/icons/icon-96x96.png',
    '../assets/icons/investment.svg',
    '../assets/icons/money-bill-stack.svg',
    '../assets/icons/other.svg',
    '../assets/icons/others.svg',
    '../assets/icons/rent.svg',
    '../assets/icons/salary.svg',
    '../assets/icons/shopping-bag.svg',
    '../assets/icons/travel.svg',
    '../assets/icons/wallet.svg',
    '../manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so both streams can be read.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
