importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'app-shell',
  })
);
workbox.precaching.precacheAndRoute([
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css'
]);
