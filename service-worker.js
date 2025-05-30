importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'app-shell',
  })
);

workbox.precaching.precacheAndRoute([
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/favicon.ico',
]);