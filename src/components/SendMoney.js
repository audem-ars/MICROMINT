// src/components/SendMoney.js
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
// Import the signing function
import { signMessage } from '../utils/crypto';

const SendMoney = () => {
  const navigate = useNavigate();
  // Note: Assuming user object contains publicKey needed for other potential operations,
  // but only privateKey from storage is needed here for signing.
  const { balance, selectedCurrency, addTransaction, user } = useApp();

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError(''); // Clear previous errors

    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setError('Please enter a recipient wallet ID');
      return;
    }

    // Check if user has enough balance
    const numAmount = parseFloat(amount);
    if (numAmount > balance[selectedCurrency]) {
      setError(`Insufficient ${selectedCurrency} balance`);
      return;
    }

    setIsLoading(true);

    try {
      // --- Start: Added Signing Logic ---

      // 1. Construct the core transaction data
      const transactionData = {
        amount: numAmount,
        currency: selectedCurrency,
        recipient: trimmedRecipient, // Use trimmed recipient
        note: note,
        timestamp: new Date().toISOString() // Add timestamp for uniqueness and order
      };

      // 2. Get the private key from secure storage (using localStorage as example)
      const privateKey = localStorage.getItem('privateKey'); // Ensure this key exists and is stored securely!

      // IMPORTANT: Add check for private key existence
      if (!privateKey) {
          throw new Error('Private key not found. Cannot sign transaction.');
      }

      // 3. Sign the transaction data
      const signature = signMessage(transactionData, privateKey);

      // 4. Add the signature to the transaction object
      // The backend/recipient will use this signature and the sender's public key to verify
      transactionData.signature = signature;
      // Optionally, you might want to include the sender's public key too
      // const publicKey = localStorage.getItem('publicKey'); // Or get from user context
      // if (publicKey) transactionData.senderPublicKey = publicKey;


      // --- End: Added Signing Logic ---

      // 5. Send the signed transaction data
      await addTransaction(transactionData); // Pass the object containing the signature

      // Navigate back to dashboard on success
      navigate('/');

    } catch (error) {
      console.error('Transaction failed:', error);
      setError(error.message || 'Transaction failed. Please try again.');
      setIsLoading(false); // Ensure loading is stopped on error
    }
    // Note: setIsLoading(false) is implicitly handled by navigation on success
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6">
        <Header title="Send Money" showBack={true} showUser={false} />

        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Amount</label>
          <div className="flex items-center">
            <input
              type="text" // Using text allows for better decimal handling
              inputMode="decimal" // Helps mobile keyboards
              className="text-3xl font-bold flex-1 outline-none"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={isLoading}
            />
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
              <span className="mr-1">{selectedCurrency}</span>
              {/* Consider making currency selection dynamic if needed */}
              <ChevronDown size={16} />
            </div>
          </div>
          {/* Display specific validation error */}
          {error && error.includes('amount') && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">To (Wallet ID)</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter recipient's wallet ID"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isLoading}
          />
           {/* Display specific validation error */}
           {error && error.includes('recipient') && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Note (optional)</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isLoading}
          />
        </div>
         {/* Display general errors (balance, signing, network) */}
         {error && !(error.includes('amount') || error.includes('recipient')) && <p className="text-red-500 text-sm mt-1 mb-4">{error}</p>}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      <div className="p-6">
        <button
          className="w-full bg-black text-white py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed" // Improved disabled style
          onClick={handleSubmit}
          disabled={isLoading || !amount || !recipient.trim()} // Disable if loading or required fields empty
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              <span>Processing...</span>
            </div>
          ) : (
            'Continue'
          )}
        </button>
        {/* This message might need context or removal depending on the actual flow */}
        {/* <div className="text-center mt-4 text-sm text-gray-500">
          You'll verify 3 transactions to send this payment.
        </div> */}
      </div>
    </div>
  );
};

export default SendMoney;