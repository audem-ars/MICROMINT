import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import { Shield, ArrowRight } from 'lucide-react';

const Verification = () => {
  const { pendingVerifications, verifyTransaction, balance } = useApp();
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  
  const handleVerify = (id) => {
    setSelectedVerification(id);
    setVerifying(true);
    
    // Simulate verification process
    setTimeout(() => {
      verifyTransaction(id);
      setVerifying(false);
      setSelectedVerification(null);
    }, 1500);
  };
  
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
              <span className="font-bold">{balance.MM.toFixed(2)} MM</span>
            </div>
          </div>
          
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
                    <div className="bg-blue-50 rounded-lg py-2 text-center text-sm font-medium text-blue-600">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Verifying...
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