importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.setConfig({ debug: false });

workbox.precaching.precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/index.html', revision: '1' },
  { url: '/assets/index-[hash].js', revision: null },
  { url: '/assets/index-[hash].css', revision: null },
]);

// Cache audio files
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

// Cache lyrics (mock for now)
workbox.routing.registerRoute(
  ({ url }) => url.pathname.includes('/lyrics'),
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