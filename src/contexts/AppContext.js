import React, { createContext, useState, useEffect, useContext } from 'react';
import dagService from '../services/DAG';

// Create the context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  // Current wallet
  const [currentWallet, setCurrentWallet] = useState(null);
  
  // Balance and transactions state
  const [balance, setBalance] = useState({
    USD: 0,
    EUR: 0,
    MM: 0
  });
  
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactions, setTransactions] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  
  // Initialize wallet and data
  useEffect(() => {
    const wallet = dagService.getCurrentWallet();
    setCurrentWallet(wallet);
    
    // Set balances
    setBalance(wallet.balances);
    
    // Load transaction history
    setTransactions(dagService.getTransactionHistory());
    
    // Load pending verifications
    setPendingVerifications(dagService.getPendingVerifications(3));
  }, []);
  
  // Functions to update state
  const addTransaction = (transaction) => {
    try {
      // Create the transaction in the DAG
      const newTransaction = dagService.createTransaction(
        transaction.amount,
        transaction.currency,
        transaction.recipient,
        transaction.note || ''
      );
      
      // Update local state
      setBalance(dagService.getCurrentWallet().balances);
      setTransactions(dagService.getTransactionHistory());
      
      return {
        ...newTransaction,
        type: 'send',
        status: 'pending'
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };
  
  const verifyTransaction = (verificationId) => {
    try {
      // Verify the transaction in the DAG
      const reward = dagService.verifyTransaction(verificationId);
      
      // Update pending verifications
      setPendingVerifications(current => 
        current.filter(v => v.id !== verificationId)
      );
      
      // Get new pending verifications to replace the verified one
      const newVerifications = dagService.getPendingVerifications(1);
      if (newVerifications.length > 0) {
        setPendingVerifications(current => [...current, ...newVerifications]);
      }
      
      // Update balances
      setBalance(dagService.getCurrentWallet().balances);
      
      // Update transaction history
      setTransactions(dagService.getTransactionHistory());
      
      return reward;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };
  
  // Refresh data
  const refreshData = () => {
    setBalance(dagService.getCurrentWallet().balances);
    setTransactions(dagService.getTransactionHistory());
    setPendingVerifications(dagService.getPendingVerifications(3));
  };

  // Value object
  const value = {
    balance,
    selectedCurrency,
    setSelectedCurrency,
    transactions,
    pendingVerifications,
    user: {
      id: currentWallet?.id || '',
      name: currentWallet?.name || 'Anonymous',
      avatar: null,
      verified: true
    },
    addTransaction,
    verifyTransaction,
    refreshData
  };

  // Return provider
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook for using the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};