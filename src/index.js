// src/index.js
// Import React and other frontend dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Use crypto module for frontend needs (now using crypto-browserify via polyfill)
const generateSignature = () => {
  // Create a simple random hex string for signatures in the frontend
  const randomHex = () => {
    let result = '';
    const characters = 'abcdef0123456789';
    for (let i = 0; i < 32; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  return 'sig_' + randomHex();
};

// Export any utility functions needed in the frontend
export { generateSignature };

// Render your React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you're using performance measurements
reportWebVitals();