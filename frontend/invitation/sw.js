const CACHE_NAME = 'invitation-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/config.js',
    '/js/app.js',
    '/img/dressCode.png',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(error => {
                console.error('Error caching assets:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip cross-origin requests, like those for Google Analytics
    if (
        !event.request.url.startsWith(self.location.origin) &&
        !event.request.url.includes('fonts.googleapis.com') &&
        !event.request.url.includes('fonts.gstatic.com') &&
        !event.request.url.includes('cdnjs.cloudflare.com') &&
        !event.request.url.includes('i.ibb.co')
    ) {
        return;
    }

    // For API requests, try network first, then cache
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }

    // For other requests, try cache first, then network
    event.respondWith(
        caches.match(event.request).then(response => {
            // Cache hit - return response
            if (response) {
                return response;
            }

            // Clone the request because it's a stream and can only be consumed once
            const fetchRequest = event.request.clone();

            return fetch(fetchRequest)
                .then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it's a stream and can only be consumed once
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // If both cache and network fail, we could return a fallback page here
                    console.log('Fetch failed; returning offline page instead.', event.request.url);
                });
        })
    );
});
