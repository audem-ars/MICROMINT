// src/components/SendMoney.js
import React, { useState, useEffect } from 'react'; // Added useEffect for potential key check
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header'; // Ensure Header is updated
// --- Import the REAL signing function ---
import { signMessage } from '../utils/crypto'; // Verify path is correct

const SendMoney = () => {
  const navigate = useNavigate();
  const { balance, selectedCurrency, addTransaction, user, currentWallet } = useApp(); // Added currentWallet

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [privateKeyExists, setPrivateKeyExists] = useState(false); // State to check key presence

  // Check for private key on component mount (optional but good UX)
  useEffect(() => {
    const key = localStorage.getItem('privateKey'); // Or secure storage method
    if (key) {
      setPrivateKeyExists(true);
    } else {
      setError("Your private key is missing. Cannot send transactions. Please re-login or restore wallet.");
    }
  }, []);


  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (error.toLowerCase().includes('amount')) setError(''); // Clear amount-related error
    }
  };

  const handleRecipientChange = (e) => {
     setRecipient(e.target.value);
     if (error.toLowerCase().includes('recipient')) setError(''); // Clear recipient-related error
  }

  const handleSubmit = async () => {
    setError(''); // Clear previous errors

    // --- 1. Frontend Validations ---
    if (!privateKeyExists) {
        setError("Cannot send: Private key is missing.");
        return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    const numAmount = parseFloat(amount); // Use the parsed number going forward

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setError('Please enter a recipient wallet ID');
      return;
    }
    // Prevent sending to self (using wallet ID from context)
    if (currentWallet && trimmedRecipient === currentWallet.id) {
         setError('You cannot send funds to your own wallet.');
         return;
    }

    // Check balance from context state
    const currentBalance = balance[selectedCurrency] || 0;
    if (numAmount > currentBalance) {
      setError(`Insufficient ${selectedCurrency} balance. Available: ${currentBalance.toFixed(8)}`);
      return;
    }

    setIsLoading(true);

    try {
      // --- 2. Prepare Data for Signing ---
      const trimmedNote = note.trim();
      const transactionTimestampString = new Date().toISOString();

      const dataToSign = {
          amount: numAmount,
          currency: selectedCurrency,
          recipient: trimmedRecipient,
          note: trimmedNote,
          timestamp: transactionTimestampString
      };
      console.log("Data to Sign:", dataToSign); // Your log

      // --- 3. Get Private Key ---
      const privateKeyHex = localStorage.getItem('privateKey');
      if (!privateKeyHex) {
          throw new Error('Private key not found locally. Cannot sign.');
      }

      // --- 4. Sign the Data ---
      console.log("Calling signMessage..."); // Your log
      const signatureHex = signMessage(dataToSign, privateKeyHex);
      console.log("Signature generated:", signatureHex); // Your log

      // --- 5. Prepare Payload for API/Context ---
      const apiPayload = {
          amount: numAmount,
          currency: selectedCurrency,
          recipient: trimmedRecipient,
          note: trimmedNote,
          timestamp: transactionTimestampString,
          signature: signatureHex
      };
      console.log("Payload for addTransaction context function:", apiPayload); // Your log

      // --- 6. Call Context Function (which calls API) ---
      await addTransaction(apiPayload);

      // --- 7. Success Navigation ---
      console.log("Transaction submitted successfully via context."); // Your log
      navigate('/');

    } catch (error) {
      console.error('Transaction failed in SendMoney component:', error); // Your log
      setError(error.message || 'Transaction failed. Please try again.');
      setIsLoading(false);
    }
    // setIsLoading(false) handled by navigation or catch block
  };

  // --- Component Return (JSX) ---
  return (
     // --- MODIFIED: Added dark background ---
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <Header title="Send Money" showBack={true} />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">

        {/* Sender Info */}
        {user && (
           // --- MODIFIED: Added dark text ---
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center -mt-2">
            Sending from: <span className="font-medium">{user.name}</span>
             {currentWallet && <span className="text-xs block text-gray-400 dark:text-gray-500">({currentWallet.id.substring(0,10)}...)</span>}
          </p>
        )}

        {/* Amount Input */}
        <div className="mb-6">
           {/* --- MODIFIED: Added dark text --- */}
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
           {/* --- MODIFIED: Added dark border, focus ring --- */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 focus-within:border-blue-500 dark:focus-within:border-blue-400">
             {/* --- MODIFIED: Added dark text --- */}
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              className="text-2xl font-semibold flex-1 p-3 outline-none border-none rounded-l-lg bg-transparent dark:text-gray-100" // Removed default bg
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={isLoading || !privateKeyExists}
              aria-describedby="amount-error"
            />
             {/* --- MODIFIED: Added dark background, border, text --- */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-r-lg px-3 py-1 h-full border-l border-gray-300 dark:border-gray-600">
              <span className="mr-1 text-sm text-gray-600 dark:text-gray-300">{selectedCurrency}</span>
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" /> {/* TODO: Currency selector dropdown */}
            </div>
          </div>
           {/* Error text color likely fine */}
          {error && error.toLowerCase().includes('amount') && <p id="amount-error" className="text-red-600 text-xs mt-1">{error}</p>}
        </div>

        {/* Recipient Input */}
        <div className="mb-6">
           {/* --- MODIFIED: Added dark text --- */}
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To (Wallet ID)</label>
           {/* --- MODIFIED: Added dark background, border, text, focus, placeholder --- */}
          <input
            id="recipient"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="Enter recipient's wallet ID (e.g., mm_...)"
            value={recipient}
            onChange={handleRecipientChange} // Use specific handler
            disabled={isLoading || !privateKeyExists}
            aria-describedby="recipient-error"
          />
           {error && error.toLowerCase().includes('recipient') && <p id="recipient-error" className="text-red-600 text-xs mt-1">{error}</p>}
        </div>

        {/* Note Input */}
        <div className="mb-6">
           {/* --- MODIFIED: Added dark text --- */}
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
           {/* --- MODIFIED: Added dark background, border, text, focus, placeholder --- */}
          <input
            id="note"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="Add a message for the recipient"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isLoading || !privateKeyExists}
          />
        </div>

        {/* General Error Display */}
        {error && !(error.toLowerCase().includes('amount') || error.toLowerCase().includes('recipient')) && (
           <p className="text-red-600 text-sm text-center mb-4">{error}</p> // Error color likely fine
        )}
         {!privateKeyExists && ( // Specific warning if key is missing
            <p className="text-red-600 text-sm text-center mb-4 font-semibold">{error}</p> // Use the error state set in useEffect
        )}

      </div> {/* End Scrollable Content */}


      {/* Fixed Bottom Button Area */}
       {/* --- MODIFIED: Added dark background, border --- */}
      <div className="p-4 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
         {/* --- MODIFIED: Added dark background, hover --- */}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isLoading || !amount || !recipient.trim() || parseFloat(amount) <= 0 || !privateKeyExists}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </div>
          ) : (
            'Send Now'
          )}
        </button>
      </div> {/* End Button Area */}

    </div> // End Main Container
  );
};

export default SendMoney;