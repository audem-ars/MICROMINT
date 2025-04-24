import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';

const SendMoney = () => {
  const navigate = useNavigate();
  const { balance, selectedCurrency, addTransaction } = useApp();
  
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };
  
  const handleSubmit = () => {
    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!recipient.trim()) {
      setError('Please enter a recipient');
      return;
    }
    
    const numAmount = parseFloat(amount);
    
    // Check if user has enough balance
    if (numAmount > balance[selectedCurrency]) {
      setError(`Insufficient ${selectedCurrency} balance`);
      return;
    }
    
    // Create transaction
    addTransaction({
      type: 'send',
      amount: numAmount,
      currency: selectedCurrency,
      recipient: recipient,
      note: note
    });
    
    // Navigate back to dashboard
    navigate('/');
  };
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6">
        <Header title="Send Money" showBack={true} showUser={false} />
        
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Amount</label>
          <div className="flex items-center">
            <input
              type="text"
              className="text-3xl font-bold flex-1 outline-none"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
            />
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
              <span className="mr-1">{selectedCurrency}</span>
              <ChevronDown size={16} />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">To</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter name, wallet ID or scan QR"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm text-gray-500 mb-2">Note (optional)</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      
      {/* Spacer */}
      <div className="flex-1"></div>
      
      <div className="p-6">
        <button 
          className="w-full bg-black text-white py-4 rounded-lg font-medium"
          onClick={handleSubmit}
        >
          Continue
        </button>
        <div className="text-center mt-4 text-sm text-gray-500">
          You'll verify 5 transactions to send this payment.
        </div>
      </div>
    </div>
  );
};

export default SendMoney;