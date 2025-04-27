// src/contexts/AppContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// REMOVED: import io from 'socket.io-client';
import * as api from '../services/api';

// Create the context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [currentWallet, setCurrentWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [balance, setBalance] = useState({
    USD: 0,
    EUR: 0,
    MM: 0 // Assuming MM is a default currency
  });

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactions, setTransactions] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize from token
  useEffect(() => {
    const initializeFromToken = async () => {
      // Make sure loading is true at the start only if a token exists
      if (token) {
          setLoading(true);
          try {
              // Validate token and get user data
              const userData = await api.getUserData(token);
              setUser(userData); // Set user state

              // Get wallet data only if userData and walletId exist
              if (userData && userData.walletId) {
                  const wallet = await api.getWallet(userData.walletId, token);
                  setCurrentWallet(wallet); // Set wallet state

                  // Set balances from the fetched wallet data
                  setBalance(wallet.balances || { USD: 0, EUR: 0, MM: 0 });

                  // Load transaction history
                  const txHistory = await api.getTransactions(userData.walletId, token);
                  setTransactions(txHistory);

                  // Load pending verifications
                  const pendingVers = await api.getPendingVerifications(3, token);
                  setPendingVerifications(pendingVers);

              } else {
                   // Handle case where user exists but walletId is missing (might be an error state)
                   console.error("User data fetched, but walletId is missing:", userData);
                   // Clear wallet-specific state
                   setCurrentWallet(null);
                   setBalance({ USD: 0, EUR: 0, MM: 0 });
                   setTransactions([]);
                   setPendingVerifications([]);
              }

          } catch (error) {
              console.error('Error initializing from token:', error);
              // Invalid token or API error, clear everything
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
              setCurrentWallet(null);
              setBalance({ USD: 0, EUR: 0, MM: 0 });
              setTransactions([]);
              setPendingVerifications([]);
          } finally {
              setLoading(false); // Stop loading indicator regardless of outcome
          }
      } else {
        // No token, ensure everything is cleared and not loading
        setLoading(false);
        setUser(null);
        setCurrentWallet(null);
        setBalance({ USD: 0, EUR: 0, MM: 0 });
        setTransactions([]);
        setPendingVerifications([]);
      }
    };

    initializeFromToken();
  }, [token]); // Re-run only when token changes


  // --- WebSocket Integration Block REMOVED ---


  // Login function
  const login = async (email, password) => {
    // No setLoading(true) here, initializeFromToken handles it
    try {
      const result = await api.login(email, password);
      localStorage.setItem('token', result.token);
      setToken(result.token); // This triggers the initialization useEffect
      return result; // Return result for potential component use
    } catch (error) {
      console.error('Login error:', error);
      // setLoading(false); // No need, initializeFromToken handles it
      throw error; // Re-throw for component handling
    }
  };

  // Signup function
  const signup = async (email, password, name) => {
     // No setLoading(true) here, initializeFromToken handles it
    try {
      const result = await api.signup(email, password, name);
      localStorage.setItem('token', result.token);
      setToken(result.token); // This triggers the initialization useEffect
      return result;
    } catch (error) {
      console.error('Signup error:', error);
       // setLoading(false); // No need, initializeFromToken handles it
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out..."); // Added log
    localStorage.removeItem('token');
    setToken(null); // Triggers initializeFromToken useEffect to clear state
    // Explicitly clear state immediately for better UX is already handled by initializeFromToken
  };

  // Functions to update state (API Calls)
  // NOTE: Without WebSockets, these actions won't reflect in real-time automatically
  // unless followed by a manual refreshData() call.
  const addTransaction = async (transactionDetails) => {
    try {
      if (!currentWallet || !token) {
        throw new Error('No active wallet or not authenticated');
      }
      const apiPayload = {
          amount: transactionDetails.amount,
          currency: transactionDetails.currency,
          recipientWalletId: transactionDetails.recipient,
          note: transactionDetails.note || '',
          timestamp: transactionDetails.timestamp,
          signature: transactionDetails.signature,
      };
      const result = await api.createTransaction(apiPayload, token);
      console.log('addTransaction API call successful:', result);
      // Consider calling refreshData() here if immediate update is needed without WS
      // await refreshData();
      return result.transaction;
    } catch (error) {
      console.error('Transaction failed (addTransaction context):', error);
      throw error;
    }
  };

  const verifyTransaction = async (transactionId) => {
    try {
      if (!currentWallet || !token) {
        throw new Error('No active wallet or not authenticated');
      }
      const result = await api.verifyTransaction(transactionId, token);
      console.log('Verification API call successful:', result);
      // Remove from pending locally immediately for better UX
      setPendingVerifications(current =>
        current.filter(v => (v.id || v._id || v.transactionId) !== transactionId) // Handle different possible ID fields
      );
      // Refresh data to get updated balance (potential reward) and maybe new pending txns
      await refreshData();
      return result.reward; // Assuming API returns reward info
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };

  // Refresh data manually if needed
  const refreshData = async () => {
    if (!currentWallet || !currentWallet.id || !token || loading) {
        console.log("Skipping refresh:", { hasWallet: !!currentWallet, hasToken: !!token, isLoading: loading });
        return;
    }
    console.log("Refreshing data manually...");
    setLoading(true);
    try {
      // Fetch all data concurrently
      // Re-fetch user data too? Maybe not needed unless walletId could change?
      const [walletData, txHistory, pendingVers] = await Promise.all([
        api.getWallet(currentWallet.id, token),
        api.getTransactions(currentWallet.id, token),
        api.getPendingVerifications(3, token)
      ]);

      console.log("Refreshed Data:", { walletData, txHistory, pendingVers }); // Log fetched data

      // Update state with fetched data
      setBalance(walletData.balances || { USD: 0, EUR: 0, MM: 0 });
      setTransactions(txHistory);
      setPendingVerifications(pendingVers);
      // Re-setting currentWallet might trigger unnecessary re-renders if object ref changes
      // Only update if necessary: setCurrentWallet(prev => ({ ...prev, ...walletData }));

    } catch (error) {
      console.error('Error refreshing data:', error);
      if (error.message && error.message.includes('401')) { // Basic check for unauthorized
          console.log("Token potentially expired during refresh, logging out.");
          logout();
      }
      // Don't clear state on refresh error, keep existing data? Or clear? Depends on desired UX.
    } finally {
        setLoading(false);
    }
  };

  // Value object provided to consumers of the context
  const value = {
    user,
    token,
    balance,
    selectedCurrency,
    setSelectedCurrency,
    transactions,
    pendingVerifications,
    currentWallet,
    loading, // Expose loading state
    login,
    signup,
    logout,
    addTransaction,
    verifyTransaction,
    refreshData,
  };

  // Return provider wrapping children
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