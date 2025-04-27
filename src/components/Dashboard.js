// src/components/Dashboard.js
import React, { useState } from 'react'; // Import useState
import { ArrowRight, ArrowLeft, Eye, EyeOff, Copy } from 'lucide-react'; // Import necessary icons
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import Transaction from './Transaction'; // Assuming this component exists and works

const Dashboard = () => {
  const navigate = useNavigate();
  // Get user and currentWallet from context as well
  const { user, balance, selectedCurrency, transactions, currentWallet, loading } = useApp();

  // State for showing/hiding public key and copy status
  const [showPubKey, setShowPubKey] = useState(false);
  const [copiedPubKey, setCopiedPubKey] = useState(false);

  // Get public key safely from currentWallet
  const publicKey = currentWallet?.publicKey;

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

  // --- Optional: Handle loading state ---
  if (loading && !currentWallet) { // Show loader only if context is loading AND wallet isn't available yet
      return (
        <div className="flex flex-col h-screen">
             <div className="flex justify-center items-center flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
             <Navigation /> {/* Show navigation even while loading? */}
        </div>
      );
  }


  return (
    // Main container using flex column for full height
    <div className="flex flex-col h-screen bg-gray-50">

      {/* --- Top Section (Balance & Actions) --- */}
      <div className="flex flex-col p-4 md:p-6 bg-white shadow-sm"> {/* Added responsive padding and shadow */}
        {/* Pass user name to header if header supports it */}
        <Header title="Balance" showUser={!!user} userName={user?.name} showCurrency={true} />

        {/* Balance Display */}
        <div className="text-4xl font-bold my-4 text-center md:text-5xl"> {/* Centered and larger text */}
          {selectedCurrency === 'USD' && '$'}
          {selectedCurrency === 'EUR' && '€'}
          {/* Safely access balance, provide default 0 */}
          {(balance[selectedCurrency] ?? 0).toFixed(2)}
          {selectedCurrency === 'MM' && ' MM'}
        </div>

        {/* Send/Receive Buttons */}
        <div className="flex space-x-3 mb-4">
          <button
            onClick={() => navigate('/send')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex justify-center items-center font-medium transition duration-150 ease-in-out" // Use theme color
          >
            <span className="mr-2">Send</span>
            <ArrowRight size={18} strokeWidth={2.5}/>
          </button>
          <button
            onClick={() => navigate('/receive')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg flex justify-center items-center font-medium border border-gray-200 transition duration-150 ease-in-out" // Clearer style
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="mr-2" />
            <span>Receive</span>
          </button>
        </div>
      </div>

      {/* --- Scrollable Middle Section (Wallet Info & Activity) --- */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto"> {/* Allow scrolling */}

        {/* --- ADDED: Wallet Info / Public Key Display Section --- */}
        {currentWallet && publicKey && (
            <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-base">Your Wallet Info</h3>
                {/* Wallet ID */}
                <div className="mb-3 pb-3 border-b border-gray-100">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Wallet ID</label>
                    <p className="text-sm font-mono text-gray-700 break-all">{currentWallet.id}</p>
                </div>
                {/* Public Key */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Public Key (Hex)</label>
                    {showPubKey ? (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono text-gray-700 break-all flex-1">{publicKey}</span>
                            {/* Hide Button */}
                            <button onClick={() => setShowPubKey(false)} title="Hide Public Key" className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <EyeOff size={16} />
                            </button>
                            {/* Copy Button */}
                            <button onClick={handleCopyPubKey} title="Copy Public Key" className="text-blue-500 hover:text-blue-700 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={copiedPubKey}>
                                {copiedPubKey ? <span className="text-xs">Copied!</span> : <Copy size={16} />}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                             {/* Show truncated key */}
                            <span className="text-sm font-mono text-gray-500 flex-1">
                                {publicKey.substring(0, 8)}...{publicKey.substring(publicKey.length - 8)}
                            </span>
                             {/* Show Button */}
                            <button onClick={() => setShowPubKey(true)} title="Show Public Key" className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <Eye size={16} />
                            </button>
                            {/* Copy Button */}
                             <button onClick={handleCopyPubKey} title="Copy Public Key" className="text-blue-500 hover:text-blue-700 p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={copiedPubKey}>
                                {copiedPubKey ? <span className="text-xs">Copied!</span> : <Copy size={16} />}
                             </button>
                        </div>
                    )}
                </div>
            </div>
        )}
        {/* --- END: Wallet Info / Public Key Display Section --- */}


        {/* Recent Activity Section */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200"> {/* Container card */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-800">Recent Activity</h2>
                <button
                    onClick={() => navigate('/verify')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition duration-150 ease-in-out" // Button style
                >
                    Verify Transactions
                </button>
            </div>

            {/* Transaction List */}
            {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                    {/* Render only first few transactions or implement pagination */}
                    {transactions.slice(0, 5).map(transaction => (
                        // Ensure Transaction component handles potential missing fields gracefully
                        <Transaction key={transaction._id || transaction.id} transaction={transaction} />
                    ))}
                    {transactions.length > 5 && (
                         <p className="text-center text-xs text-gray-500 pt-2">...</p> // Indicate more exist
                    )}
                </div>
            ) : (
                <div className="text-center py-6 text-sm text-gray-500">
                    No transactions recorded yet.
                </div>
            )}
        </div> {/* End Activity Section Card */}

      </div> {/* End Scrollable Area */}


      {/* --- Bottom Navigation --- */}
      <Navigation />
    </div> // End Main Container
  );
};

export default Dashboard;