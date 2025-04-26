// src/contexts/AppContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client'; // Import socket.io-client
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
      if (token) {
        try {
          setLoading(true);
          // Validate token and get user data
          const userData = await api.getUserData(token);
          setUser(userData);

          // Get wallet data
          // IMPORTANT: Ensure your wallet object returned by api.getWallet includes an 'id' field
          // that matches the walletId used for socket rooms on the backend.
          const wallet = await api.getWallet(userData.walletId, token);
          setCurrentWallet(wallet); // Assuming wallet object has { id: '...', balances: {...} }

          // Set balances from the fetched wallet data
          setBalance(wallet.balances || { USD: 0, EUR: 0, MM: 0 }); // Provide default if balances missing

          // Load transaction history
          const txHistory = await api.getTransactions(userData.walletId, token);
          setTransactions(txHistory);

          // Load pending verifications
          const pendingVers = await api.getPendingVerifications(3, token);
          setPendingVerifications(pendingVers);

        } catch (error) {
          console.error('Error initializing from token:', error);
          // Invalid token, clear it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setCurrentWallet(null); // Clear wallet on error too
          setBalance({ USD: 0, EUR: 0, MM: 0 }); // Reset balance
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Not logged in
        // Ensure state is clear when not logged in
        setUser(null);
        setCurrentWallet(null);
        setBalance({ USD: 0, EUR: 0, MM: 0 });
        setTransactions([]);
        setPendingVerifications([]);
      }
    };

    initializeFromToken();
  }, [token]); // Re-run only when token changes

  // --- Start: Added WebSocket Integration ---
  useEffect(() => {
    // Only attempt connection if we have a valid wallet ID
    if (currentWallet && currentWallet.id) {
      console.log(`Attempting to connect WebSocket for wallet: ${currentWallet.id}`);

      // Initialize socket connection
      // Connects to the server that served the page by default.
      // If your backend is hosted elsewhere, provide the URL: io('http://your-backend-url:port')
      const socket = io();

      socket.on('connect', () => {
        console.log(`Socket connected: ${socket.id}, joining room ${currentWallet.id}`);
        // Join wallet-specific room once connected
        socket.emit('join-wallet', currentWallet.id);
      });

      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Listen for new transactions created *by this wallet*
      socket.on('transaction-created', (transaction) => {
        console.log('Received transaction-created event:', transaction);
        // Update transactions list (add to beginning)
        setTransactions(prev => [transaction, ...prev.filter(t => t.id !== transaction.id)]); // Avoid duplicates

        // Update balance (subtract amount)
        // Ensure balance exists for this currency before subtracting
        setBalance(prev => ({
          ...prev,
          [transaction.currency]: (prev[transaction.currency] || 0) - transaction.amount
        }));
      });

      // Listen for transactions received *by this wallet*
      socket.on('transaction-received', (transaction) => {
        console.log('Received transaction-received event:', transaction);
        // Update transactions list (add to beginning)
        setTransactions(prev => [transaction, ...prev.filter(t => t.id !== transaction.id)]); // Avoid duplicates

        // Update balance (add amount)
        // Ensure balance exists for this currency before adding
        setBalance(prev => ({
          ...prev,
          [transaction.currency]: (prev[transaction.currency] || 0) + transaction.amount
        }));
      });

      // Listen for new global verification opportunities
      socket.on('new-verification', (verificationOpportunity) => {
        console.log('Received new-verification event:', verificationOpportunity);
        // Update pending verifications (add to beginning, prevent duplicates)
        setPendingVerifications(prev => {
            // Check if this transaction ID is already in the pending list
            if (prev.some(v => v.transactionId === verificationOpportunity.transactionId)) {
                return prev; // Already exists, don't add again
            }
            return [verificationOpportunity, ...prev];
        });
      });

      // Cleanup function: Disconnect socket when component unmounts or wallet changes
      return () => {
        console.log(`Disconnecting WebSocket for wallet: ${currentWallet.id}`);
        socket.disconnect();
      };
    } else {
        // If there's no current wallet, ensure no lingering connection attempt happens
        console.log("No current wallet, skipping WebSocket connection.");
        // Optional: explicitly disconnect any potential previous socket? Usually handled by useEffect cleanup.
    }
  }, [currentWallet]); // Dependency array: Re-run when currentWallet changes
  // --- End: Added WebSocket Integration ---

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true); // Add loading state for login
      const result = await api.login(email, password);
      localStorage.setItem('token', result.token);
      // Setting token triggers the initializeFromToken useEffect
      setToken(result.token);
      // Note: setUser and other states are set within initializeFromToken
      return result;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false); // Clear loading on error
      throw error; // Re-throw for component handling
    } finally {
      // Loading set to false within initializeFromToken's finally block
    }
  };

  // Signup function
  const signup = async (email, password, name) => {
    try {
      setLoading(true); // Add loading state for signup
      const result = await api.signup(email, password, name);
      localStorage.setItem('token', result.token);
      // Setting token triggers the initializeFromToken useEffect
      setToken(result.token);
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false); // Clear loading on error
      throw error;
    } finally {
       // Loading set to false within initializeFromToken's finally block
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null); // Triggers initializeFromToken useEffect to clear state
    // Explicitly clear state immediately for better UX
    setUser(null);
    setCurrentWallet(null);
    setBalance({ USD: 0, EUR: 0, MM: 0 });
    setTransactions([]);
    setPendingVerifications([]);
  };

  // Functions to update state (API Calls that might trigger WS events)
  const addTransaction = async (transactionDetails) => {
    // Renamed input parameter for clarity
    try {
      if (!currentWallet || !token) {
        throw new Error('No active wallet or not authenticated');
      }

      // Prepare data for API (assuming API expects specific fields like signature)
      // This part needs to align with your SendMoney component and API requirements
      const apiPayload = {
          amount: transactionDetails.amount,
          currency: transactionDetails.currency,
          recipientWalletId: transactionDetails.recipient,
          note: transactionDetails.note || '',
          // Timestamp and signature should be added HERE before sending to API
          // This requires crypto utils and private key access within this context/flow
          // For now, assuming they are added correctly before this function is called
          // or handled within SendMoney and passed in transactionDetails
          timestamp: transactionDetails.timestamp,
          signature: transactionDetails.signature,
      };


      // Call the API to create the transaction
      const result = await api.createTransaction(apiPayload, token);

      // Optimistic UI updates are handled by WebSocket events ('transaction-created')
      // No need to manually update balance/transactions here if WS is reliable.
      // If WS might fail, consider adding manual refresh as fallback.
      console.log('addTransaction API call successful:', result);

      return result.transaction; // Return the result from the API if needed

    } catch (error) {
      console.error('Transaction failed (addTransaction context):', error);
      throw error; // Re-throw for component error handling
    }
  };

  const verifyTransaction = async (transactionId) => {
    try {
      if (!currentWallet || !token) {
        throw new Error('No active wallet or not authenticated');
      }

      // Call the API to verify the transaction
      const result = await api.verifyTransaction(transactionId, token);

      // Optimistic UI update: remove from pending locally immediately
      setPendingVerifications(current =>
        current.filter(v => v.id !== transactionId) // Assuming API returns { id: ... }
        // Or use v.transactionId if that's what the API returns/WS sends
      );

      // Fetching new verifications, balances, and history might still be useful
      // especially if the verification grants a reward or confirms other transactions.
      // Consider if WS events cover all necessary state updates.
      await refreshData(); // Refresh might be simplest way to ensure consistency

      return result.reward; // Assuming API returns reward info
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };

  // Refresh data manually if needed
  const refreshData = async () => {
    // Prevent refresh if not logged in or no wallet
    if (!currentWallet || !currentWallet.id || !token || loading) return;

    console.log("Refreshing data...");
    setLoading(true); // Indicate loading during refresh
    try {
      // Fetch all data concurrently
      const [walletData, txHistory, pendingVers] = await Promise.all([
        api.getWallet(currentWallet.id, token), // Fetch full wallet including balances
        api.getTransactions(currentWallet.id, token),
        api.getPendingVerifications(3, token) // Fetch standard number of verifications
      ]);

      // Update state with fetched data
      setBalance(walletData.balances || { USD: 0, EUR: 0, MM: 0 }); // Update balance from wallet data
      setTransactions(txHistory);
      setPendingVerifications(pendingVers);
      // Optionally update currentWallet if other wallet details might change
      // setCurrentWallet(walletData);

    } catch (error) {
      console.error('Error refreshing data:', error);
      // Optionally handle token expiration during refresh
      if (error.response && error.response.status === 401) {
          logout(); // Log out if token is invalid
      }
    } finally {
        setLoading(false); // Clear loading indicator
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
    login,
    signup,
    logout,
    addTransaction, // Expose the function to trigger transactions
    verifyTransaction, // Expose the function to trigger verifications
    refreshData, // Expose manual refresh
    loading // Expose loading state
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