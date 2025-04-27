// src/components/Dashboard.js
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Copy, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import Transaction from './Transaction';

const Dashboard = () => {
  const navigate = useNavigate();
  // Get user and currentWallet from context as well
  const { user, balance, selectedCurrency, transactions, currentWallet, loading } = useApp();

  // State for showing/hiding public key and copy status
  const [showPubKey, setShowPubKey] = useState(false);
  const [copiedPubKey, setCopiedPubKey] = useState(false);

  // --- Logging for Debugging ---
  console.log("Dashboard Render - Loading:", loading);
  console.log("Dashboard Render - User:", user);
  console.log("Dashboard Render - Current Wallet:", currentWallet);
  // -----------------------------

  // Get public key safely from currentWallet
  const publicKey = currentWallet?.publicKey;
  console.log("Dashboard Render - Extracted Public Key:", publicKey); // Log extracted key

  // Function to copy public key to clipboard
  const handleCopyPubKey = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
        .then(() => {
          setCopiedPubKey(true);
          setTimeout(() => setCopiedPubKey(false), 2000); // Reset after 2s
        })
        .catch(err => {
           console.error('Failed to copy public key: ', err);
           alert('Failed to copy key. Please try again.'); // User feedback
        });
    }
  };

  // --- Handle Initial Loading State ---
  // Show loader only if context indicates loading AND we don't have the essential wallet info yet
  if (loading && !currentWallet) {
      return (
        // Use a layout that includes Navigation to avoid layout shifts
        <div className="flex flex-col h-screen bg-gray-50">
             <Header title="Loading..." /> {/* Simple header */}
             <div className="flex justify-center items-center flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
             <Navigation />
        </div>
      );
  }

  // --- Handle Case where user logged in but wallet somehow missing ---
  // This might indicate an issue during signup or data fetching
  if (user && !currentWallet && !loading) {
       return (
         <div className="flex flex-col h-screen bg-gray-50">
              <Header title="Error" />
              <div className="flex flex-col justify-center items-center flex-1 p-6 text-center">
                 <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                 <h2 className="text-lg font-semibold mb-2">Wallet Not Found</h2>
                 <p className="text-sm text-gray-600">
                     Could not load your wallet details. Please try logging out and back in.
                     If the problem persists, contact support.
                 </p>
                 {/* Optional: Add logout button here */}
              </div>
              <Navigation />
         </div>
       );
  }

  // --- Main Dashboard Render ---
  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Top Section (Balance & Actions) */}
      <div className="flex flex-col p-4 md:p-6 bg-white shadow-sm">
        {/* Use the real Header component */}
        <Header title="Balance" showUser={!!user} userName={user?.name} showCurrency={true} />

        <div className="text-4xl font-bold my-4 text-center md:text-5xl">
          {selectedCurrency === 'USD' && '$'}
          {selectedCurrency === 'EUR' && '€'}
          {(balance?.[selectedCurrency] ?? 0).toFixed(2)} {/* Safer balance access */}
          {selectedCurrency === 'MM' && ' MM'}
        </div>

        <div className="flex space-x-3 mb-4">
          <button
            onClick={() => navigate('/send')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex justify-center items-center font-medium transition duration-150 ease-in-out shadow-sm"
          >
            <span className="mr-2">Send</span>
            <ArrowRight size={18} strokeWidth={2.5}/>
          </button>
          <button
            onClick={() => navigate('/receive')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg flex justify-center items-center font-medium border border-gray-200 transition duration-150 ease-in-out shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="mr-2" />
            <span>Receive</span>
          </button>
        </div>
      </div>

      {/* Scrollable Middle Section */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">

        {/* Wallet Info / Public Key Display Section */}
        {/* Check currentWallet first before trying to access publicKey */}
        {currentWallet && (
            <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-base">Your Wallet Info</h3>
                {/* Wallet ID */}
                <div className="mb-3 pb-3 border-b border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Wallet ID</label>
                    <p className="text-sm font-mono text-gray-700 break-all">{currentWallet.id || 'N/A'}</p>
                </div>
                {/* Public Key */}
                {/* Check specifically for publicKey existence */}
                {publicKey ? (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Public Key (Hex)</label>
                        {showPubKey ? (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono text-gray-700 break-all flex-1">{publicKey}</span>
                                <button onClick={() => setShowPubKey(false)} title="Hide Public Key" className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <EyeOff size={16} />
                                </button>
                                <button onClick={handleCopyPubKey} title="Copy Public Key" className="text-blue-500 hover:text-blue-700 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={copiedPubKey}>
                                    {copiedPubKey ? <span className="text-xs">Copied!</span> : <Copy size={16} />}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono text-gray-500 flex-1">
                                    {publicKey.substring(0, 8)}...{publicKey.substring(publicKey.length - 8)}
                                </span>
                                <button onClick={() => setShowPubKey(true)} title="Show Public Key" className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <Eye size={16} />
                                </button>
                                 <button onClick={handleCopyPubKey} title="Copy Public Key" className="text-blue-500 hover:text-blue-700 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={copiedPubKey}>
                                    {copiedPubKey ? <span className="text-xs">Copied!</span> : <Copy size={16} />}
                                 </button>
                            </div>
                        )}
                    </div>
                 ) : (
                     <p className="text-xs text-red-500">Public key not found for this wallet.</p>
                 )}
            </div>
        )}
        {/* End Wallet Info Section */}


        {/* Recent Activity Section */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-800">Recent Activity</h2>
                <button
                    onClick={() => navigate('/verify')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition duration-150 ease-in-out"
                >
                    Verify Transactions
                </button>
            </div>

            {/* Transaction List */}
            {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                    {transactions.slice(0, 5).map(transaction => (
                        <Transaction key={transaction._id || transaction.id} transaction={transaction} />
                    ))}
                    {transactions.length > 5 && (
                         <p className="text-center text-xs text-gray-500 pt-2">...</p>
                    )}
                </div>
            ) : (
                <div className="text-center py-6 text-sm text-gray-500">
                    No transactions recorded yet.
                </div>
            )}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default Dashboard;