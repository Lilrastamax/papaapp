const CACHE = 'papaapp-v9';
const STATIC = ['/','/index.html','/app.css','/app.js','/manifest.json','/icon-192.png','/icon-512.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  // Network-first for HTML/JS (always get latest)
  if (e.request.destination === 'document' || e.request.destination === 'script') {
    e.respondWith(fetch(e.request).then(res => { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); return res; }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});

// Force update: notify clients when new SW activates
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
