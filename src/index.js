import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- Added Service Worker Registration ---
// Check if service workers are supported by the browser
if ('serviceWorker' in navigator) {
  // Register the service worker after the page has loaded
  window.addEventListener('load', () => {
    // The path '/service-worker.js' assumes your service worker file is
    // placed in the root of your build output folder (e.g., 'public' or 'build').
    // Adjust the path if your build process places it elsewhere.
    // Common alternative might be '/serviceWorker.js' if using CRA's default naming.
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}
// --- End Service Worker Registration ---