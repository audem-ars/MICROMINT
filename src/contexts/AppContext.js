import React, { createContext, useState, useContext } from 'react';

// Create the context
const AppContext = createContext();

// Sample transaction data
const sampleTransactions = [
  { id: 1, type: 'send', amount: 25.00, currency: 'USD', recipient: 'Sarah Chen', date: '2h ago', status: 'completed' },
  { id: 2, type: 'receive', amount: 150.00, currency: 'USD', sender: 'Work Project', date: '1d ago', status: 'completed' },
  { id: 3, type: 'verify', amount: 2.50, currency: 'MM', description: 'Verification reward', date: '1d ago', status: 'completed' },
  { id: 4, type: 'send', amount: 50.00, currency: 'EUR', recipient: 'Online Store', date: '3d ago', status: 'completed' },
  { id: 5, type: 'receive', amount: 75.25, currency: 'USD', sender: 'Client Payment', date: '5d ago', status: 'completed' }
];

// Sample verification data
const sampleVerifications = [
  { id: 101, amount: 35.00, currency: 'USD', sender: 'Alex Morgan', recipient: 'Wallet #8f92', date: '2m ago', reward: 0.45 },
  { id: 102, amount: 120.00, currency: 'EUR', sender: 'Wallet #3d7f', recipient: 'Global Shop', date: '5m ago', reward: 0.52 },
  { id: 103, amount: 5.50, currency: 'USD', sender: 'Wallet #a12b', recipient: 'Coffee Shop', date: '8m ago', reward: 0.25 }
];

// Provider component
export const AppProvider = ({ children }) => {
  // Define state
  const [balance, setBalance] = useState({
    USD: 1250.75,
    EUR: 980.30,
    MM: 512.45
  });
  
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [pendingVerifications, setPendingVerifications] = useState(sampleVerifications);
  const [user, setUser] = useState({
    id: 'mm_8f92a6d1b4c7',
    name: 'Alex Smith',
    avatar: null,
    verified: true
  });

  // Functions to update state
  const addTransaction = (transaction) => {
    const newTransaction = {
      id: transactions.length + 100,
      date: 'Just now',
      status: 'pending',
      ...transaction
    };
    
    setTransactions([newTransaction, ...transactions]);
    
    // If it's a send transaction, update balance
    if (transaction.type === 'send') {
      setBalance({
        ...balance,
        [transaction.currency]: balance[transaction.currency] - transaction.amount
      });
    }
    
    // Simulate transaction completion after 2 seconds
    setTimeout(() => {
      setTransactions(current => 
        current.map(tx => 
          tx.id === newTransaction.id ? { ...tx, status: 'completed' } : tx
        )
      );
    }, 2000);
    
    return newTransaction;
  };
  
  const verifyTransaction = (verificationId) => {
    // Remove from pending verifications
    setPendingVerifications(current => 
      current.filter(v => v.id !== verificationId)
    );
    
    // Add verification reward to MM balance
    const verification = pendingVerifications.find(v => v.id === verificationId);
    
    if (verification) {
      // Add to MM balance
      setBalance({
        ...balance,
        MM: balance.MM + verification.reward
      });
      
      // Add to transaction history
      addTransaction({
        type: 'verify',
        amount: verification.reward,
        currency: 'MM',
        description: 'Verification reward'
      });
    }
  };

  // Value object
  const value = {
    balance,
    selectedCurrency,
    setSelectedCurrency,
    transactions,
    pendingVerifications,
    user,
    addTransaction,
    verifyTransaction
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