// src/components/ReceiveMoney.js
import React, { useState } from 'react';
// Ensure 'user' is kept in the destructuring below
import { useApp } from '../contexts/AppContext';
import Header from './Header'; // Ensure Header is updated

const ReceiveMoney = () => {
  // Keep 'user' here as we will use it now
  const { user, currentWallet, selectedCurrency } = useApp();
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleCopy = () => {
    if (currentWallet?.id) {
      navigator.clipboard.writeText(currentWallet.id);
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  // Generate QR code URL (placeholder - in real app would generate actual QR)
  // Ensure currentWallet.id is available before encoding
  const walletId = currentWallet?.id || '';
  const qrData = `micromint:${walletId}${amount ? `?amount=${amount}¤cy=${selectedCurrency}` : ''}`;
  // QR Server might not have a dark mode option, consider generating SVG QR locally for theme control
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  return (
     // --- MODIFIED: Added dark background ---
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
        {/* --- Assuming Header is updated --- */}
        <Header title="Receive Money" showBack={true} />
        {/* --- MODIFIED: Added dark background --- */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 dark:bg-gray-900">

        {/* QR Code Display */}
        <div className="flex justify-center mb-6">
           {/* --- MODIFIED: Added dark background, border --- */}
          <div className="w-64 h-64 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 bg-white shadow-sm dark:bg-gray-700 dark:border-gray-600">
            {walletId ? (
               // --- MODIFIED: Added dark background for image container if image fails/is transparent ---
               <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-200">
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
               </div>
            ) : (
               // --- MODIFIED: Added dark text ---
              <p className="text-gray-500 dark:text-gray-400">Loading Wallet...</p>
            )}
          </div>
        </div>

        {/* --- ADDED USER NAME DISPLAY --- */}
        {user && user.name && (
           // --- MODIFIED: Added dark text ---
          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-4 -mt-2">
            Wallet for: <span className="font-medium">{user.name}</span>
          </p>
        )}
        {/* --- END OF ADDED USER NAME --- */}

        {/* Wallet ID Input */}
        <div className="mb-6">
           {/* --- MODIFIED: Added dark text --- */}
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Wallet ID</label>
          <div className="flex">
             {/* --- MODIFIED: Added dark background, border, text --- */}
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 rounded-l-lg bg-gray-100 text-gray-700 text-sm focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" // Improved styling
              value={walletId}
              readOnly
            />
             {/* --- MODIFIED: Added dark background, border, text, hover, copied state --- */}
            <button
              className={`flex items-center justify-center px-4 border border-gray-300 border-l-0 rounded-r-lg text-sm transition-colors duration-150 ease-in-out dark:border-gray-600 ${copied ? 'bg-green-500 text-white dark:bg-green-600 dark:text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}
              onClick={handleCopy}
              disabled={!walletId} // Disable copy if no wallet ID
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Optional Amount Input */}
        <div className="mb-6">
           {/* --- MODIFIED: Added dark text --- */}
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request Specific Amount (Optional)</label>
          <div className="flex items-center">
             {/* --- MODIFIED: Added dark background, border, text, focus --- */}
            <input
              type="text" // Consider type="number" with step="any" for better mobile experience
              inputMode="decimal" // Hint for numeric keyboard
              className="flex-1 p-3 border border-gray-300 rounded-l-lg text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400" // Added focus styles
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
            />
             {/* --- MODIFIED: Added dark background, border, text --- */}
            <div className="bg-gray-100 p-3 border border-gray-300 border-l-0 rounded-r-lg text-sm text-gray-600 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
              {selectedCurrency}
            </div>
          </div>
          {amount && ( // Only show message if amount is entered
              // --- MODIFIED: Added dark text ---
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
               QR code updated to request {amount} {selectedCurrency}.
             </p>
          )}
        </div>

        {/* Instructions Section */}
        <div className="mt-8">
           {/* --- MODIFIED: Added dark background, border --- */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
             {/* --- MODIFIED: Added dark text --- */}
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">How to receive funds</h3>
             {/* --- MODIFIED: Added dark text --- */}
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside"> {/* Changed to list */}
              <li>Share your QR code or Wallet ID.</li>
              <li>Sender scans/enters your details to send funds.</li>
              <li>Funds appear after network verification.</li>
              <li>Micro Mint Network means no fees!</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Removed duplicate Navigation, assuming it's rendered globally */}
    </div>
  );
};

export default ReceiveMoney;