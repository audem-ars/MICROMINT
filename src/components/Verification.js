// src/components/Verification.js
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header'; // IMPORTANT: Ensure Header is updated
import Navigation from './Navigation'; // This file will be updated next
import { Shield, ArrowRight } from 'lucide-react';

const Verification = () => {
  const { pendingVerifications, verifyTransaction, balance, refreshData } = useApp();
  const [selectedVerificationId, setSelectedVerificationId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationWorker, setVerificationWorker] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // --- completeVerification (Your exact function) ---
  const completeVerification = useCallback((verificationResult) => {
    console.log("[Verification Component] completeVerification called with result:", verificationResult);
    const txIdToVerify = verificationResult?.transactionId;
    if (!txIdToVerify) {
         console.error("[Verification Component] Cannot complete verification, transactionId missing in worker result:", verificationResult);
         setVerifying(false);
         setVerificationProgress(0);
         setSelectedVerificationId(null);
         alert('Verification completion error: Missing ID from worker.');
         return;
    }
    setVerificationDetails(verificationResult);
    setTimeout(async () => {
      try {
        console.log("[Verification Component] Calling context verifyTransaction for ID:", txIdToVerify);
        await verifyTransaction(txIdToVerify);
        console.log("[Verification Component] Context verifyTransaction finished for ID:", txIdToVerify);
        setVerifying(false);
        setVerificationProgress(0);
        setShowDetails(true);
        setTimeout(() => {
          setShowDetails(false);
          setVerificationDetails(null);
          setSelectedVerificationId(null);
        }, 5000);
      } catch (error) {
        console.error('[Verification Component] Verification failed after context call:', error);
        setVerifying(false);
        setVerificationProgress(0);
        setSelectedVerificationId(null);
        alert('Verification failed: ' + error.message);
      }
    }, 750);
  }, [verifyTransaction]);

  // --- Initialize web worker (Your exact function) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("[Verification Component] Initializing web worker...");
      const worker = new Worker('/verification-worker.js');
      worker.addEventListener('message', (event) => {
          console.log("[Verification Component] Received message from worker:", event.data);
          const { type, progress, verification } = event.data;
          if (type === 'progress') {
              setVerificationProgress(progress);
          } else if (type === 'result') {
              console.log("[Verification Component] Worker Result received, calling completeVerification:", verification);
              completeVerification(verification);
          } else if (type === 'error') {
              console.error("[Verification Component] Error message from worker:", event.data.message);
              setVerifying(false);
              setVerificationProgress(0);
              setSelectedVerificationId(null);
              alert(`Verification worker error: ${event.data.message || 'Unknown worker error'}`);
          }
       });
       worker.addEventListener('error', (event) => {
            console.error("[Verification Component] Uncaught error in worker:", event);
            setVerifying(false);
            setVerificationProgress(0);
            setSelectedVerificationId(null);
            alert('An unexpected error occurred in the verification worker.');
       });
      setVerificationWorker(worker);
      console.log("[Verification Component] Web worker set.");
      return () => {
        console.log("[Verification Component] Terminating web worker.");
        worker.terminate();
        setVerificationWorker(null);
      };
    }
  }, [completeVerification]);

  // --- handleVerify (Your exact function) ---
  const handleVerify = (id) => {
    if (verifying) {
        console.log("[Verification Component] Verification already in progress, ignoring click for ID:", id);
        return;
    };
    console.log("[Verification Component] handleVerify called for ID:", id);
    setSelectedVerificationId(id);
    setVerifying(true);
    setVerificationProgress(0);
    const verificationData = pendingVerifications.find(v => (v.id || v._id || v.transactionId) === id);
    console.log("[Verification Component] Found verification data:", verificationData);
    if (verificationWorker && verificationData) {
        console.log("[Verification Component] Posting 'verify' command to worker...");
        const actualId = verificationData.id || verificationData._id || verificationData.transactionId;
        verificationWorker.postMessage({
            command: 'verify',
            transaction: {
                id: actualId,
                amount: verificationData.amount,
                currency: verificationData.currency,
                // sender: verificationData.senderWalletId, // Uncomment if needed by worker
                // recipient: verificationData.recipientWalletId // Uncomment if needed by worker
            }
        });
    } else {
        console.warn("[Verification Component] Worker not ready or verification data not found. Using simulation fallback or erroring.", { hasWorker: !!verificationWorker, hasData: !!verificationData });
        // --- MODIFIED: Optionally call simulateVerification IF worker isn't available but data is ---
        if (!verificationWorker && verificationData) {
             simulateVerification(id); // Call your simulation as a fallback
        } else {
            // Original error handling if worker OR data missing
            setVerifying(false);
            setSelectedVerificationId(null);
            alert("Verification system not ready or data missing. Please try again later.");
        }
    }
  };

  // --- Fallback simulation (Your exact function - kept intact!) ---
  const simulateVerification = async (id) => {
    console.warn("[Verification Component] Using simulateVerification (fallback) for ID:", id);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setVerificationProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        console.log("[Verification Component] Simulation complete, calling context verifyTransaction for ID:", id);
        try {
             // Calling verifyTransaction within the simulation fallback
             // Note: Awaiting this might be better if verifyTransaction returns a promise
             verifyTransaction(id);
             setVerifying(false);
             setVerificationProgress(0);
             setSelectedVerificationId(null);
        } catch(error) {
            console.error('[Verification Component] Verification failed during simulation fallback:', error);
            setVerifying(false);
            setVerificationProgress(0);
            setSelectedVerificationId(null);
            alert('Verification failed (simulation): ' + error.message);
        }
      }
    }, 200);
  };

  // --- useEffect for refreshData (Your exact function) ---
  useEffect(() => {
    console.log("Verification component mounted, calling refreshData once.");
    if (refreshData) {
         refreshData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Component Return (JSX - with dark mode styles added) ---
  return (
     // --- MODIFIED: Added dark background ---
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Verify Transactions" showBack={true} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">

        {/* Balance Info Card */}
         {/* --- MODIFIED: Added dark background, border, text --- */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
           {/* --- MODIFIED: Added dark text --- */}
          <div className="flex items-center mb-2">
            <Shield size={20} className="text-blue-600 mr-2" /> {/* Icon color likely ok */}
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Verification Rewards</h3>
          </div>
           {/* --- MODIFIED: Added dark text --- */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Earn MM tokens for each transaction you verify, helping secure the network at zero cost.
          </p>
           {/* --- MODIFIED: Added dark background, text --- */}
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <span className="text-sm text-gray-600 dark:text-gray-300">Your MM Balance:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{balance?.MM?.toFixed(2) || '0.00'} MM</span>
          </div>
        </div>

        {/* Verification Details Modal */}
        {showDetails && verificationDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10 p-4 transition-opacity duration-300 ease-out" style={{ opacity: 1 }}>
              {/* --- MODIFIED: Added dark background, text --- */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl transform transition-all duration-300 ease-out scale-100">
                 {/* --- MODIFIED: Added dark text, hover --- */}
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">Verification Complete</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-center mb-3">
                     {/* --- MODIFIED: Added dark background --- */}
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                       {/* --- MODIFIED: Added dark icon color --- */}
                      <Shield size={32} className="text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                   {/* --- MODIFIED: Added dark text --- */}
                  <p className="text-center font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Transaction {verificationDetails.transactionId?.substring(0, 8) ?? 'N/A'}... verified!
                  </p>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                    You earned MM tokens for securing the network.
                  </p>
                </div>
                 {/* --- MODIFIED: Added dark border, text --- */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4">
                  <h4 className="font-medium mb-2 text-sm text-gray-900 dark:text-gray-100">Verification Details</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                       {/* --- MODIFIED: Added dark text --- */}
                      <span className="text-gray-500 dark:text-gray-400">Compute time:</span>
                      <span className="dark:text-gray-200">{verificationDetails.timeElapsed ?? 'N/A'}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Iterations:</span>
                      <span className="dark:text-gray-200">{verificationDetails.iterations ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Proof hash:</span>
                      <span className="font-mono truncate w-36 text-right dark:text-gray-200">{verificationDetails.proofHash?.substring(0, 16) ?? 'N/A'}...</span>
                    </div>
                  </div>
                </div>
                 {/* --- MODIFIED: Added dark background, hover --- */}
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium text-sm transition duration-150 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  OK
                </button>
              </div>
            </div>
          )}

        {/* Pending Verifications List */}
        <div className="mb-4">
           {/* --- MODIFIED: Added dark text, background --- */}
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Pending Verifications</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
              {pendingVerifications.length} available
            </span>
          </div>

          {/* Loading/Empty States */}
           {!pendingVerifications && (
                // --- MODIFIED: Added dark background, text ---
               <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl">Loading...</div>
           )}
           {pendingVerifications && pendingVerifications.length === 0 && (
                // --- MODIFIED: Added dark background, text ---
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl">
                No pending verifications available right now.
              </div>
           )}

          {/* Actual List */}
          {pendingVerifications && pendingVerifications.length > 0 && (
            <div className="space-y-3">
              {pendingVerifications.map(verification => {
                  const itemId = verification.id || verification._id || verification.transactionId;
                  if (!itemId) {
                      console.warn("Pending verification item missing usable ID:", verification);
                      return null;
                  }
                  const isCurrentlyVerifying = selectedVerificationId === itemId && verifying;

                  return (
                       // --- MODIFIED: Added dark background, border, hover ---
                      <div key={itemId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-700/30">
                           {/* --- MODIFIED: Added dark text --- */}
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{verification.amount?.toFixed(2) ?? '?'} {verification.currency ?? '?'}</span>
                               {/* --- MODIFIED: Added dark background, text --- */}
                              {typeof verification.reward === 'number' && (
                                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full dark:text-green-400 dark:bg-green-900/50">+{verification.reward?.toFixed(2)} MM</span>
                              )}
                          </div>
                           {/* --- MODIFIED: Added dark text --- */}
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                              <span className="truncate">
                                  From: <span className="font-mono">{verification.senderWalletId?.substring(0, 10) ?? '?'}...</span>
                              </span>
                              <span className="truncate text-right">
                                  To: <span className="font-mono">{verification.recipientWalletId?.substring(0, 10) ?? '?'}...</span>
                              </span>
                          </div>
                           {/* --- MODIFIED: Added dark text --- */}
                          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                              {verification.timestamp ? new Date(verification.timestamp).toLocaleString() : 'No date'}
                          </div>

                          {/* Progress Bar or Button */}
                          {isCurrentlyVerifying ? (
                              <div className="mb-1">
                                   {/* --- MODIFIED: Added dark background --- */}
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden my-1">
                                      <div
                                          // Gradient likely fine
                                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-150 ease-linear"
                                          style={{ width: `${verificationProgress}%` }}
                                      ></div>
                                  </div>
                                   {/* --- MODIFIED: Added dark text --- */}
                                  <div className="flex justify-between mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                      <span>Verifying...</span>
                                      <span>{Math.round(verificationProgress)}%</span>
                                  </div>
                              </div>
                          ) : (
                              <button
                                  // --- MODIFIED: Added dark background, hover, disabled state ---
                                  className={`w-full bg-black hover:bg-gray-800 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center transition duration-150 ease-in-out dark:bg-gray-600 dark:hover:bg-gray-500 ${verifying ? 'opacity-50 cursor-not-allowed dark:opacity-40' : ''}`}
                                  onClick={() => handleVerify(itemId)}
                                  disabled={verifying}
                              >
                                  <span>Verify Transaction</span>
                                  <ArrowRight size={16} className="ml-2" />
                              </button>
                          )}
                      </div>
                  );
              })}
            </div>
          )}
        </div>

        {/* How it Works Section */}
        {/* --- MODIFIED: Added dark border, text --- */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">How Verification Works</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>
                By verifying transactions, you help secure the Micro Mint network and enable zero-fee payments for everyone.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>Confirm transaction validity (simulated).</li>
                <li>Earn MM tokens as a reward for your contribution.</li>
                <li>Help maintain the integrity of the transaction graph.</li>
              </ul>
            </div>
          </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default Verification;