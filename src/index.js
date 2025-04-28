// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your main CSS
import App from './App'; // Your main App component
import { AppProvider } from './contexts/AppContext'; // Import the Provider
import reportWebVitals from './reportWebVitals';

// Remove utility functions from here - they belong elsewhere (e.g., utils/crypto.js)
/*
const generateSignature = () => { ... };
export { generateSignature }; // Don't export utilities from index.js
*/

// Render your React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* --- AppProvider now wraps the entire App --- */}
    <AppProvider>
      <App />
    </AppProvider>
    {/* ------------------------------------------ */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();