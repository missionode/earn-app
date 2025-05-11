const CACHE_NAME = 'earn-app-v5';
const urlsToCache = [
    './',
    'index.html',
    'splash.html',
    'receive.html',
    'receive-qr.html',
    'send.html',
    'css/styles.css',
    'css/index.css',
    'css/splash.css',
    'css/receive.css',
    'css/receive-qr.css',
    'css/send.css',
    'js/script.js',
    'js/index.js',
    'js/splash.js',
    'js/receive.js',
    'js/receive-qr.js',
    'js/send.js',
    'assets/images/logo.png', // Add other essential image assets
    'assets/icons/arrow-down.svg',
    'assets/icons/arrow-up.svg',
    'assets/icons/wallet.svg',
    'assets/icons/money-bill-stack.svg',
    'assets/icons/food.svg',
    'assets/icons/shopping-bag.svg',
    'assets/icons/entertainment.svg',
    'assets/icons/travel.svg',
    'assets/icons/others.svg',
    'manifest.json'
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