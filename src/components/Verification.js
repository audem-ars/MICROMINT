import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import { Shield, ArrowRight, BarChart2 } from 'lucide-react';

const Verification = () => {
  const { pendingVerifications, verifyTransaction, balance, refreshData } = useApp();
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationWorker, setVerificationWorker] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Initialize web worker for verification
  useEffect(() => {
    // Only create worker in browser environment (not during SSR)
    if (typeof window !== 'undefined') {
      const worker = new Worker('/verification-worker.js');
      
      worker.addEventListener('message', (event) => {
        const { type, progress, verification } = event.data;
        
        if (type === 'progress') {
          setVerificationProgress(progress);
        } else if (type === 'result') {
          // Verification completed
          completeVerification(verification);
        }
      });
      
      setVerificationWorker(worker);
      
      return () => {
        worker.terminate();
      };
    }
  }, []);
  
  // Complete verification
  const completeVerification = (verification) => {
    setVerificationDetails(verification);
    
    // Add a slight delay to show 100% progress
    setTimeout(() => {
      try {
        verifyTransaction(selectedVerification);
        setVerifying(false);
        setVerificationProgress(0);
        setShowDetails(true);
        
        // Close details after 5 seconds
        setTimeout(() => {
          setShowDetails(false);
          setVerificationDetails(null);
          setSelectedVerification(null);
        }, 5000);
      } catch (error) {
        console.error('Verification failed:', error);
        setVerifying(false);
        setVerificationProgress(0);
        alert('Verification failed: ' + error.message);
      }
    }, 500);
  };
  
  const handleVerify = (id) => {
    if (verifying) return;
    
    setSelectedVerification(id);
    setVerifying(true);
    setVerificationProgress(0);
    
    // Find the verification in the list
    const verification = pendingVerifications.find(v => v.id === id);
    
    // Start verification process
    if (verificationWorker && verification) {
      verificationWorker.postMessage({
        command: 'verify',
        transaction: {
          id: verification.id,
          amount: verification.amount,
          currency: verification.currency,
          sender: verification.sender,
          recipient: verification.recipient
        }
      });
    } else {
      // Fallback if web worker isn't available
      simulateVerification(id);
    }
  };
  
  // Fallback verification simulation
  const simulateVerification = (id) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setVerificationProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        // Complete the verification
        verifyTransaction(id);
        setVerifying(false);
        setVerificationProgress(0);
        setSelectedVerification(null);
      }
    }, 200);
  };
  
  // Refresh data when component mounts
  useEffect(() => {
    refreshData && refreshData();
  }, [refreshData]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white overflow-auto">
        <div className="p-6">
          <Header title="Verify Transactions" showBack={true} />
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center mb-3">
              <Shield size={20} className="text-blue-600 mr-2" />
              <h3 className="font-medium">Verification Balance</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              You earn MM tokens for each transaction you verify, helping secure the network.
            </p>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Current rewards:</span>
              <span className="font-bold">{balance?.MM?.toFixed(2) || '0.00'} MM</span>
            </div>
          </div>
          
          {/* Verification details modal */}
          {showDetails && verificationDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">Verification Complete</h3>
                  <button 
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500"
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
                    Transaction {verificationDetails.transactionId.substring(0, 8)}... verified!
                  </p>
                  <p className="text-center text-sm text-gray-600">
                    You have earned MM tokens for your contribution to network security.
                  </p>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-medium mb-2">Verification Details</h4>
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Computation time:</span>
                      <span>{verificationDetails.timeElapsed}ms</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Iterations:</span>
                      <span>{verificationDetails.iterations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Proof hash:</span>
                      <span className="truncate w-32 text-right">{verificationDetails.proofHash.substring(0, 12)}...</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowDetails(false)}
                  className="w-full bg-black text-white rounded-lg py-3 font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Pending Verifications</h3>
              <span className="text-sm text-gray-500">{pendingVerifications.length} available</span>
            </div>
            
            {pendingVerifications.length > 0 ? (
              pendingVerifications.map(verification => (
                <div key={verification.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{verification.amount} {verification.currency}</span>
                    <span className="text-green-600">+{verification.reward} MM</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-3">
                    <span>{verification.sender} → {verification.recipient}</span>
                    <span>{verification.date}</span>
                  </div>
                  
                  {selectedVerification === verification.id && verifying ? (
                    <div className="mb-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300 ease-out"
                          style={{ width: `${verificationProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>Verifying transaction...</span>
                        <span>{Math.round(verificationProgress)}%</span>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="w-full bg-black text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center"
                      onClick={() => handleVerify(verification.id)}
                    >
                      <span>Verify Transaction</span>
                      <ArrowRight size={16} className="ml-1" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
                No pending verifications
              </div>
            )}
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="font-medium mb-3">How Verification Works</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                When you verify a transaction, you:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Confirm the transaction is valid</li>
                <li>Help secure the Micro Mint network</li>
                <li>Earn MM tokens as a reward</li>
                <li>Enable zero-fee transactions for everyone</li>
              </ul>
              <p>
                Each user must verify 5 transactions to send their own payment, creating a sustainable ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default Verification;