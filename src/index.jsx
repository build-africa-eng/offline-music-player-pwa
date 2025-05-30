import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Workbox } from 'workbox-window';

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  const wb = new Workbox('/service-worker.js');
  wb.register().catch(err => console.error('Service Worker registration failed:', err));
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);