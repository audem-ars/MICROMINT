// src/components/Dashboard.js
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Copy, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import Transaction from './Transaction';

// Helper to get currency symbol (optional)
const getCurrencySymbol = (currency) => {
    switch (currency) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'MM': return ''; // MM token might not have a standard symbol
        default: return '';
    }
};

const Dashboard = () => {
  const navigate = useNavigate();
  // Need setSelectedCurrency from context now
  const {
      user,
      balance, // Object like { USD: 100, EUR: 50, MM: 200 }
      selectedCurrency,
      setSelectedCurrency, // Function to change the currency
      transactions,
      currentWallet,
      loading
  } = useApp();

  const [showPubKey, setShowPubKey] = useState(false);
  const [copiedPubKey, setCopiedPubKey] = useState(false);

  console.log("Dashboard Render - Loading:", loading);
  console.log("Dashboard Render - User:", user);
  console.log("Dashboard Render - Current Wallet:", currentWallet);
  const publicKey = currentWallet?.publicKey;
  console.log("Dashboard Render - Extracted Public Key:", publicKey);
  console.log("Dashboard Render - Balance Object:", balance); // Log the balance object


  const handleCopyPubKey = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
        .then(() => {
          setCopiedPubKey(true);
          setTimeout(() => setCopiedPubKey(false), 2000);
        })
        .catch(err => {
           console.error('Failed to copy public key: ', err);
           alert('Failed to copy key.');
        });
    }
  };

  // --- Loading / Error States ---
  if (loading && !currentWallet) {
      return (
        <div className="flex flex-col h-screen bg-gray-50">
             <Header title="Loading..." showUser={false} showCurrency={false}/>
             <div className="flex justify-center items-center flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
             <Navigation />
        </div>
      );
  }
  if (user && !currentWallet && !loading) {
       return (
         <div className="flex flex-col h-screen bg-gray-50">
              <Header title="Error" showUser={false} showCurrency={false}/>
              <div className="flex flex-col justify-center items-center flex-1 p-6 text-center">
                 <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                 <h2 className="text-lg font-semibold mb-2">Wallet Not Found</h2>
                 <p className="text-sm text-gray-600">Could not load wallet details. Try logging out and back in.</p>
              </div>
              <Navigation />
         </div>
       );
  }

  // Get available currencies from the balance object keys
  // Ensure balance object exists and has keys before trying to map
  const availableCurrencies = balance ? Object.keys(balance) : [];

  // --- Main Dashboard Render ---
  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* --- Top Section (Balance & Actions) --- */}
      <div className="flex flex-col p-4 md:p-6 bg-white shadow-sm">
        {/* Pass showCurrency={false} as Dashboard handles selection now */}
        <Header title="Wallet" showUser={!!user} userName={user?.name} showCurrency={false} />

        {/* --- ADDED: Currency Selector Tabs --- */}
        <div className="flex justify-center space-x-1 my-4 border-b border-gray-200 pb-3">
          {availableCurrencies.length > 0 ? (
                availableCurrencies.map((currency) => (
                    <button
                        key={currency}
                        onClick={() => setSelectedCurrency(currency)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                            ${selectedCurrency === currency
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`
                        }
                    >
                        {currency}
                    </button>
                ))
            ) : (
                 <p className="text-sm text-gray-400">No currencies available.</p>
            )
          }
        </div>
        {/* --- END: Currency Selector Tabs --- */}


        {/* Selected Balance Display */}
        <div className="text-4xl font-bold mb-4 text-center md:text-5xl">
          {getCurrencySymbol(selectedCurrency)}
          {(balance?.[selectedCurrency] ?? 0).toFixed(2)}
          {selectedCurrency === 'MM' && ' MM'} {/* Append symbol for MM */}
        </div>

        {/* Send/Receive Buttons */}
        <div className="flex space-x-3 mb-4">
          {/* Send Button */}
          <button
            onClick={() => navigate('/send')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex justify-center items-center font-medium transition duration-150 ease-in-out shadow-sm"
          >
            <span className="mr-2">Send</span>
            <ArrowRight size={18} strokeWidth={2.5}/>
          </button>
           {/* Receive Button */}
          <button
            onClick={() => navigate('/receive')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg flex justify-center items-center font-medium border border-gray-200 transition duration-150 ease-in-out shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="mr-2" />
            <span>Receive</span>
          </button>
        </div>
      </div>

      {/* --- Scrollable Middle Section --- */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">

         {/* --- ADDED: All Balances Overview --- */}
         <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
             <h3 className="font-semibold text-gray-800 mb-3 text-base">All Balances</h3>
             {availableCurrencies.length > 0 ? (
                 <div className="space-y-2">
                     {Object.entries(balance).map(([currency, amount]) => (
                         <div key={currency} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                             <span className="font-medium text-gray-600">{currency}</span>
                             <span className="font-mono text-gray-800">
                                 {getCurrencySymbol(currency)}{amount?.toFixed(2) ?? '0.00'}{currency === 'MM' ? ' MM' : ''}
                             </span>
                         </div>
                     ))}
                 </div>
             ) : (
                 <p className="text-sm text-gray-500">No balance information available.</p>
             )}
         </div>
         {/* --- END: All Balances Overview --- */}


        {/* Wallet Info / Public Key Display Section */}
        {currentWallet && (
            <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-base">Your Wallet Info</h3>
                <div className="mb-3 pb-3 border-b border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Wallet ID</label>
                    <p className="text-sm font-mono text-gray-700 break-all">{currentWallet.id || 'N/A'}</p>
                </div>
                {publicKey ? (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Public Key (Hex)</label>
                        {showPubKey ? (
                             <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono text-gray-700 break-all flex-1">{publicKey}</span>
                                <button onClick={() => setShowPubKey(false)} title="Hide Public Key" className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"> <EyeOff size={16} /> </button>
                                <button onClick={handleCopyPubKey} title="Copy Public Key" className="text-blue-500 hover:text-blue-700 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" disabled={copiedPubKey}> {copiedPubKey ? <span className="text-xs">Copied!</span> : <Copy size={16} />} </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                               <span className="text-sm font-mono text-gray-500 flex-1">
                                 {publicKey.length > 12 ? `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 6)}` : publicKey}
                               </span>
                               <button onClick={() => setShowPubKey(true)} title="Show Public Key" className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"> <Eye size={16} /> </button>
                               <button onClick={handleCopyPubKey} title="Copy Public Key" className="text-blue-500 hover:text-blue-700 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" disabled={copiedPubKey}> {copiedPubKey ? <span className="text-xs">Copied!</span> : <Copy size={16} />} </button>
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
                <button onClick={() => navigate('/verify')} className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition duration-150">
                    Verify Transactions
                </button>
            </div>
            {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                    {transactions.slice(0, 5).map(transaction => (
                        <Transaction key={transaction._id || transaction.id} transaction={transaction} />
                    ))}
                    {transactions.length > 5 && <p className="text-center text-xs text-gray-500 pt-2">...</p>}
                </div>
            ) : (
                <div className="text-center py-6 text-sm text-gray-500"> No transactions recorded yet. </div>
            )}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default Dashboard;