// src/contexts/AppContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../services/api';

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
  const [loading, setLoading] = useState(true);
  
  // Initialize wallet and data
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Check if we have a wallet ID in localStorage
        let walletId = localStorage.getItem('walletId');
        
        if (!walletId) {
          // Create a new wallet
          const result = await api.createWallet('My Wallet');
          walletId = result.wallet.id;
          localStorage.setItem('walletId', walletId);
          localStorage.setItem('privateKey', result.wallet.privateKey);
        }
        
        // Get wallet data
        const wallet = await api.getWallet(walletId);
        setCurrentWallet(wallet);
        
        // Set balances
        setBalance(wallet.balances);
        
        // Load transaction history
        const txHistory = await api.getTransactions(walletId);
        setTransactions(txHistory);
        
        // Load pending verifications
        const pendingVers = await api.getPendingVerifications(3);
        setPendingVerifications(pendingVers);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing wallet:', error);
        setLoading(false);
      }
    };
    
    initializeWallet();
  }, []);
  
  // Functions to update state
  const addTransaction = async (transaction) => {
    try {
      if (!currentWallet) {
        throw new Error('No active wallet');
      }
      
      // Create the transaction via API
      const result = await api.createTransaction({
        amount: transaction.amount,
        currency: transaction.currency,
        senderWalletId: currentWallet.id,
        recipientWalletId: transaction.recipient,
        note: transaction.note || ''
      });
      
      // Refresh balances
      const newBalance = await api.getBalance(currentWallet.id);
      setBalance(newBalance);
      
      // Refresh transaction history
      const txHistory = await api.getTransactions(currentWallet.id);
      setTransactions(txHistory);
      
      return result.transaction;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };
  
  const verifyTransaction = async (transactionId) => {
    try {
      if (!currentWallet) {
        throw new Error('No active wallet');
      }
      
      // Verify the transaction via API
      const result = await api.verifyTransaction(transactionId, currentWallet.id);
      
      // Update pending verifications
      setPendingVerifications(current => 
        current.filter(v => v.id !== transactionId)
      );
      
      // Get new pending verifications to replace the verified one
      const newVerifications = await api.getPendingVerifications(1);
      if (newVerifications.length > 0) {
        setPendingVerifications(current => [...current, ...newVerifications]);
      }
      
      // Refresh balances
      const newBalance = await api.getBalance(currentWallet.id);
      setBalance(newBalance);
      
      // Refresh transaction history
      const txHistory = await api.getTransactions(currentWallet.id);
      setTransactions(txHistory);
      
      return result.reward;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };
  
  // Refresh data
  const refreshData = async () => {
    if (!currentWallet) return;
    
    try {
      const [newBalance, txHistory, pendingVers] = await Promise.all([
        api.getBalance(currentWallet.id),
        api.getTransactions(currentWallet.id),
        api.getPendingVerifications(3)
      ]);
      
      setBalance(newBalance);
      setTransactions(txHistory);
      setPendingVerifications(pendingVers);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
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
    refreshData,
    loading
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