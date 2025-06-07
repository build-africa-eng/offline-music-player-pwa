importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

workbox.setConfig({ debug: false });

workbox.precaching.precacheAndRoute([
  { url: '/', revision: '5' }, // Increment to force cache update
  { url: '/index.html', revision: '5' },
  { url: '/assets/index-*.js', revision: null },
  { url: '/assets/index-*.css', revision: null },
  { url: '/logo.png', revision: '1' },
  { url: '/icon.png', revision: '1' },
  { url: '/favicon.ico', revision: '1' },
], {
  ignoreURLParametersMatching: [/[hash]/],
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'audio-cache' && cacheName !== 'lyrics-cache') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'audio',
  new workbox.strategies.CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ url }) => url.pathname.endsWith('.lrc'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'lyrics-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.setCatchHandler(({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/index.html');
  }
  return Response.error();
});
