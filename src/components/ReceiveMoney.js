import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header';

const ReceiveMoney = () => {
  const { user, selectedCurrency } = useApp();
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
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Generate QR code URL (placeholder - in real app would generate actual QR)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `micromint:${user.id}${amount ? `?amount=${amount}&currency=${selectedCurrency}` : ''}`
  )}`;
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6">
        <Header title="Receive Money" showBack={true} showUser={false} />
        
        <div className="flex justify-center mb-6">
          <div className="w-64 h-64 rounded-lg flex items-center justify-center overflow-hidden">
            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Your Wallet ID</label>
          <div className="flex">
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 rounded-l-lg bg-gray-50"
              value={user.id}
              readOnly
            />
            <button 
              className="bg-gray-100 px-4 border border-gray-300 border-l-0 rounded-r-lg"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Request Amount (optional)</label>
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 p-3 border border-gray-300 rounded-l-lg"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
            />
            <div className="bg-gray-100 p-3 border border-gray-300 border-l-0 rounded-r-lg">
              {selectedCurrency}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Updating the amount will regenerate the QR code.
          </p>
        </div>
        
        <div className="mt-8">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-2">How to receive money</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>1. Share your QR code or Wallet ID with the sender</li>
              <li>2. The sender scans or enters your information</li>
              <li>3. Once the transaction is verified, funds will appear in your account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveMoney;