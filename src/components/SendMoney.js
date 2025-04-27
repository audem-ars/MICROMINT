import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Keep 'user' in the destructuring below
import { useApp } from '../contexts/AppContext';
import Header from './Header';
// Import the signing function
import { signMessage } from '../utils/crypto';

const SendMoney = () => {
  const navigate = useNavigate();
  // Keep 'user' as we will now use it
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
      setError(''); // Clear error on valid input change
    }
  };

  const handleSubmit = async () => {
    setError(''); // Clear previous errors

    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setError('Please enter a recipient wallet ID');
      return;
    }

    // Check if user has enough balance
    const numAmount = parseFloat(amount);
    if (numAmount > (balance[selectedCurrency] || 0)) { // Added check for undefined balance
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
        note: note.trim(), // Trim note as well
        timestamp: new Date().toISOString() // Add timestamp
      };

      // 2. Get the private key from secure storage
      const privateKey = localStorage.getItem('privateKey'); // Ensure this is stored securely!

      if (!privateKey) {
          // Handle this more gracefully in a real app (e.g., prompt user to log in again or restore wallet)
          throw new Error('Private key not found. Cannot sign transaction. Please ensure you are logged in correctly.');
      }

      // 3. Sign the transaction data
      const signature = signMessage(transactionData, privateKey);

      // 4. Add the signature to the transaction object
      transactionData.signature = signature;
      // Optionally include sender public key if needed by backend
      // const publicKey = localStorage.getItem('publicKey');
      // if (publicKey) transactionData.senderPublicKey = publicKey;


      // --- End: Added Signing Logic ---

      // 5. Send the signed transaction data
      await addTransaction(transactionData); // Pass the object containing the signature

      // Navigate back to dashboard on success
      navigate('/'); // Navigate AFTER successful API call

    } catch (error) {
      console.error('Transaction failed:', error);
      // Provide more specific error messages if possible from the error object
      setError(error.response?.data?.message || error.message || 'Transaction failed. Please try again.');
      setIsLoading(false); // Ensure loading is stopped on error
    }
    // No finally block needed here as navigation handles success state implicitly
  };

  return (
    <div className="flex flex-col h-screen bg-white"> {/* Use h-screen */}
      {/* Main content area with padding and scroll */}
      <div className="flex-1 overflow-y-auto p-6 pb-24"> {/* Added padding-bottom */}
        <Header title="Send Money" showBack={true} />

        {/* --- ADDED SENDER NAME DISPLAY --- */}
        {user && user.name && (
          <p className="text-sm text-gray-600 mb-4 text-center -mt-2"> {/* Pulled up slightly */}
            Sending from: <span className="font-medium">{user.name}</span>
          </p>
        )}
        {/* --- END OF ADDED SENDER NAME --- */}

        {/* Amount Input */}
        <div className="mb-6">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
            <input
              id="amount"
              type="text" // Use text for better decimal input control
              inputMode="decimal" // Hint for numeric keyboard on mobile
              className="text-2xl font-semibold flex-1 p-3 outline-none border-none rounded-l-lg" // Adjusted size and removed internal borders
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={isLoading}
              aria-describedby="amount-error" // For accessibility
            />
            {/* Currency Selector (Static for now) */}
            <div className="flex items-center bg-gray-100 rounded-r-lg px-3 py-1 h-full border-l border-gray-300">
              <span className="mr-1 text-sm text-gray-600">{selectedCurrency}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
          {/* Display specific validation error */}
          {error && error.toLowerCase().includes('amount') && <p id="amount-error" className="text-red-600 text-xs mt-1">{error}</p>}
        </div>

        {/* Recipient Input */}
        <div className="mb-6">
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">To (Wallet ID)</label>
          <input
            id="recipient"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm" // Consistent focus and text size
            placeholder="Enter recipient's wallet ID"
            value={recipient}
            onChange={(e) => { setRecipient(e.target.value); setError(''); }} // Clear error on change
            disabled={isLoading}
            aria-describedby="recipient-error"
          />
           {/* Display specific validation error */}
           {error && error.toLowerCase().includes('recipient') && <p id="recipient-error" className="text-red-600 text-xs mt-1">{error}</p>}
        </div>

        {/* Note Input */}
        <div className="mb-6">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
          <input
            id="note"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Add a message for the recipient"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isLoading}
          />
        </div>
         {/* Display general errors (balance, signing, network, etc.) */}
         {error && !(error.toLowerCase().includes('amount') || error.toLowerCase().includes('recipient')) && (
            <p className="text-red-600 text-sm text-center mb-4">{error}</p>
         )}
      </div>

      {/* Fixed Bottom Button Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={isLoading || !amount || !recipient.trim() || parseFloat(amount) <= 0} // More robust disable condition
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
            'Send Now' // Changed button text
          )}
        </button>
      </div>
    </div>
  );
};

export default SendMoney;