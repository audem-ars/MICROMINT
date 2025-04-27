import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import { Shield, ArrowRight } from 'lucide-react';

const Verification = () => {
  const { pendingVerifications, verifyTransaction, balance, refreshData } = useApp();
  const [selectedVerificationId, setSelectedVerificationId] = useState(null); // Store only the ID being verified
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationWorker, setVerificationWorker] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null); // Stores results from worker for modal
  const [showDetails, setShowDetails] = useState(false); // Controls modal visibility

  // --- NEW: completeVerification using worker result ---
  const completeVerification = useCallback((verificationResult) => { // Changed param name for clarity
    console.log("[Verification Component] completeVerification called with result:", verificationResult); // Log entry
    // Use verificationResult.transactionId from the worker's result object
    const txIdToVerify = verificationResult?.transactionId;

    if (!txIdToVerify) {
         console.error("[Verification Component] Cannot complete verification, transactionId missing in worker result:", verificationResult);
         setVerifying(false);
         setVerificationProgress(0);
         setSelectedVerificationId(null); // Clear the ID state
         alert('Verification completion error: Missing ID from worker.');
         return;
    }

    setVerificationDetails(verificationResult); // Store full result from worker for the modal

    // Use a slightly longer delay before calling API to ensure UI updates
    setTimeout(async () => { // Make async to await verifyTransaction
      try {
        console.log("[Verification Component] Calling context verifyTransaction for ID:", txIdToVerify); // Log before context call
        await verifyTransaction(txIdToVerify); // Await the context function and pass ID from worker result
        console.log("[Verification Component] Context verifyTransaction finished for ID:", txIdToVerify); // Log after context call

        // Reset loading state after successful context call
        setVerifying(false);
        setVerificationProgress(0);
        setShowDetails(true); // Show success modal

        // Close details modal after 5 seconds
        setTimeout(() => {
          setShowDetails(false);
          setVerificationDetails(null);
          setSelectedVerificationId(null); // Clear selected ID state
        }, 5000);

      } catch (error) {
        console.error('[Verification Component] Verification failed after context call:', error);
        // Reset state on error
        setVerifying(false);
        setVerificationProgress(0);
        setSelectedVerificationId(null); // Clear selected ID state
        alert('Verification failed: ' + error.message); // Show error to user
      }
    }, 750); // Increased delay slightly
  }, [verifyTransaction]); // Only depends on verifyTransaction from context now

  // Initialize web worker for verification
  useEffect(() => {
    // Only create worker in browser environment
    if (typeof window !== 'undefined') {
      console.log("[Verification Component] Initializing web worker...");
      const worker = new Worker('/verification-worker.js'); // Path relative to public folder

      // --- NEW: worker message listener with more logging ---
      worker.addEventListener('message', (event) => {
          console.log("[Verification Component] Received message from worker:", event.data); // Log ALL messages
          const { type, progress, verification } = event.data; // verification here is the RESULT object from worker
          if (type === 'progress') {
              // console.log("[Verification Component] Worker Progress:", progress); // Optional: too noisy?
              setVerificationProgress(progress);
          } else if (type === 'result') {
              console.log("[Verification Component] Worker Result received, calling completeVerification:", verification); // Log result
              completeVerification(verification); // Pass the result object
          } else if (type === 'error') { // Handle potential errors from worker
              console.error("[Verification Component] Error message from worker:", event.data.message);
              setVerifying(false); // Reset state on worker error
              setVerificationProgress(0);
              setSelectedVerificationId(null); // Clear the ID state
              alert(`Verification worker error: ${event.data.message || 'Unknown worker error'}`);
          }
       });

       worker.addEventListener('error', (event) => {
            console.error("[Verification Component] Uncaught error in worker:", event);
            // Attempt to reset UI state if worker crashes unexpectedly
            setVerifying(false);
            setVerificationProgress(0);
            setSelectedVerificationId(null);
            alert('An unexpected error occurred in the verification worker.');
       });

      setVerificationWorker(worker);
      console.log("[Verification Component] Web worker set.");

      // Cleanup function
      return () => {
        console.log("[Verification Component] Terminating web worker.");
        worker.terminate();
        setVerificationWorker(null); // Clear worker state on unmount
      };
    }
    // Run only once on mount, relies on completeVerification being stable via useCallback
  }, [completeVerification]);

  // --- NEW: handleVerify with more logging ---
  const handleVerify = (id) => {
    // Prevent starting a new verification if one is already in progress
    if (verifying) {
        console.log("[Verification Component] Verification already in progress, ignoring click for ID:", id);
        return;
    };
    console.log("[Verification Component] handleVerify called for ID:", id); // Log start
    setSelectedVerificationId(id); // Store the ID of the transaction being verified
    setVerifying(true); // Set loading state for the component (affects all buttons)
    setVerificationProgress(0);

    // Find the specific transaction data from the pending list
    // Check common ID fields: id, _id, transactionId
    const verificationData = pendingVerifications.find(v => (v.id || v._id || v.transactionId) === id);
    console.log("[Verification Component] Found verification data:", verificationData); // Log data found

    if (verificationWorker && verificationData) {
        console.log("[Verification Component] Posting 'verify' command to worker..."); // Log before post
        // Determine the actual ID field to send to the worker
        const actualId = verificationData.id || verificationData._id || verificationData.transactionId;
        // Ensure all necessary data for the worker simulation is passed
        verificationWorker.postMessage({
            command: 'verify',
            transaction: {
                id: actualId, // Pass the ID the worker expects
                amount: verificationData.amount,
                currency: verificationData.currency,
                // Add any other fields the worker's verifyTransaction needs
                // sender: verificationData.senderWalletId,
                // recipient: verificationData.recipientWalletId
            }
        });
    } else {
        console.warn("[Verification Component] Worker not ready or verification data not found. Cannot start verification.", { hasWorker: !!verificationWorker, hasData: !!verificationData });
        // Reset state if verification cannot start
        setVerifying(false);
        setSelectedVerificationId(null);
        alert("Verification system not ready or data missing. Please try again later.");
    }
  };

  // Fallback simulation (kept for reference, but primary path is worker)
  // Consider removing if worker path is reliable
  const simulateVerification = async (id) => { // Make async
    console.warn("[Verification Component] Using simulateVerification (fallback) for ID:", id);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setVerificationProgress(Math.min(progress, 100)); // Cap progress at 100

      if (progress >= 100) {
        clearInterval(interval);
        console.log("[Verification Component] Simulation complete, calling context verifyTransaction for ID:", id);
        try {
             verifyTransaction(id); // Call context function directly
             // Reset state after calling (might be slightly premature if API fails)
             setVerifying(false);
             setVerificationProgress(0);
             setSelectedVerificationId(null);
             // TODO: Maybe show the success modal here too after API call confirms?
             // Would need to await verifyTransaction and handle result/error.
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

  // --- FIXED: useEffect for refreshData ---
  useEffect(() => {
    console.log("Verification component mounted, calling refreshData once."); // Add log
    if (refreshData) { // Check if refreshData exists before calling
         refreshData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array runs only on mount

  // --- Component Return (JSX) ---
  return (
    <div className="flex flex-col h-screen bg-gray-50"> {/* Use h-screen */}
      <Header title="Verify Transactions" showBack={true} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20"> {/* Added padding bottom */}

        {/* Balance Info Card */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
          <div className="flex items-center mb-2">
            <Shield size={20} className="text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-800">Verification Rewards</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Earn MM tokens for each transaction you verify, helping secure the network at zero cost.
          </p>
          <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
            <span className="text-sm text-gray-600">Your MM Balance:</span>
            <span className="font-bold text-indigo-600">{balance?.MM?.toFixed(2) || '0.00'} MM</span>
          </div>
        </div>

        {/* Verification Details Modal */}
        {showDetails && verificationDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4 transition-opacity duration-300 ease-out" style={{ opacity: 1 }}>
              {/* Modal content */}
              <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl transform transition-all duration-300 ease-out scale-100">
                 {/* ... (rest of modal content remains the same) ... */}
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">Verification Complete</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield size={32} className="text-green-600" />
                    </div>
                  </div>

                  <p className="text-center font-medium mb-2">
                    Transaction {verificationDetails.transactionId?.substring(0, 8) ?? 'N/A'}... verified!
                  </p>
                  <p className="text-center text-sm text-gray-600">
                    You earned MM tokens for securing the network.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-medium mb-2 text-sm">Verification Details</h4>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Compute time:</span>
                      <span>{verificationDetails.timeElapsed ?? 'N/A'}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Iterations:</span>
                      <span>{verificationDetails.iterations ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Proof hash:</span>
                      <span className="font-mono truncate w-36 text-right">{verificationDetails.proofHash?.substring(0, 16) ?? 'N/A'}...</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium text-sm transition duration-150"
                >
                  OK
                </button>
              </div>
            </div>
          )}

        {/* Pending Verifications List */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-semibold text-gray-800">Pending Verifications</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {pendingVerifications.length} available
            </span>
          </div>

          {/* Loading/Empty States */}
           {!pendingVerifications && ( // Use loading state from context if available
               <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">Loading...</div>
           )}
           {pendingVerifications && pendingVerifications.length === 0 && (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
                No pending verifications available right now.
              </div>
           )}

          {/* Actual List */}
          {pendingVerifications && pendingVerifications.length > 0 && (
            <div className="space-y-3">
              {pendingVerifications.map(verification => {
                  // Determine the unique ID for this item
                  const itemId = verification.id || verification._id || verification.transactionId;
                  if (!itemId) {
                      console.warn("Pending verification item missing usable ID:", verification);
                      return null; // Skip rendering items without a valid ID
                  }

                  const isCurrentlyVerifying = selectedVerificationId === itemId && verifying;

                  return (
                      <div key={itemId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
                          {/* Transaction Details */}
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-lg text-gray-800">{verification.amount?.toFixed(2) ?? '?'} {verification.currency ?? '?'}</span>
                              {/* Display potential reward if available */}
                              {typeof verification.reward === 'number' && (
                                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+{verification.reward?.toFixed(2)} MM</span>
                              )}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-3">
                              <span className="truncate">
                                  From: <span className="font-mono">{verification.senderWalletId?.substring(0, 10) ?? '?'}...</span>
                              </span>
                              <span className="truncate text-right">
                                  To: <span className="font-mono">{verification.recipientWalletId?.substring(0, 10) ?? '?'}...</span>
                              </span>
                          </div>
                          <div className="text-xs text-gray-400 mb-3">
                              {verification.timestamp ? new Date(verification.timestamp).toLocaleString() : 'No date'}
                          </div>

                          {/* Progress Bar or Button */}
                          {isCurrentlyVerifying ? (
                              <div className="mb-1">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden my-1">
                                      <div
                                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-150 ease-linear"
                                          style={{ width: `${verificationProgress}%` }}
                                      ></div>
                                  </div>
                                  <div className="flex justify-between mt-1 text-xs text-blue-600 font-medium">
                                      <span>Verifying...</span>
                                      <span>{Math.round(verificationProgress)}%</span>
                                  </div>
                              </div>
                          ) : (
                              <button
                                  className={`w-full bg-black hover:bg-gray-800 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center transition duration-150 ease-in-out ${verifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  onClick={() => handleVerify(itemId)}
                                  disabled={verifying} // Disable button if ANY verification is in progress
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
        <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-800 mb-3">How Verification Works</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                By verifying transactions, you help secure the Micro Mint network and enable zero-fee payments for everyone.
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>Confirm transaction validity (simulated).</li>
                <li>Earn MM tokens as a reward for your contribution.</li>
                <li>Help maintain the integrity of the transaction graph.</li>
              </ul>
              {/* <p>
                Each user must verify 5 transactions to send their own payment, creating a sustainable ecosystem.
              </p> */}
            </div>
          </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default Verification;