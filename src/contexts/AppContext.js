// src/contexts/AppContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// REMOVED: import io from 'socket.io-client'; // Assuming still removed
import * as api from '../services/api'; // Assuming api.js handles the actual fetch calls

// Create the context
const AppContext = createContext();

// --- Helper function to get initial theme (Your function) ---
const getInitialTheme = () => { /* ... */ };

// Provider component
export const AppProvider = ({ children }) => {
  const [currentWallet, setCurrentWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  // --- State for Private Key (In-Memory - Better than localStorage but still temporary) ---
  // --- IMPORTANT: This key will be lost on page refresh. Needs secure persistent storage for production. ---
  const [transientPrivateKey, setTransientPrivateKey] = useState(null);
  // -----------------------------------------------------------------------------------------
  const [balance, setBalance] = useState({ USD: 0, EUR: 0, MM: 0 });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactions, setTransactions] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState(getInitialTheme);

  // --- Theme Effect (Your effect) ---
  useEffect(() => { /* ... */ }, [theme]);

  // --- Initialize from token (Your effect - NO CHANGES NEEDED HERE YET) ---
  // It fetches user and wallet data AFTER login/refresh based on token.
  // It does NOT handle fetching the private key.
  useEffect(() => {
    const initializeFromToken = async () => {
        if (token) {
            setLoading(true);
            try {
                // Fetch user data using the token
                const userData = await api.getUserData(token); // Assumes api.getUserData exists
                setUser(userData);

                // Fetch wallet data if user and walletId exist
                if (userData && userData.walletId) {
                    const wallet = await api.getWallet(userData.walletId, token); // Assumes api.getWallet exists
                    setCurrentWallet(wallet);
                    setBalance(wallet.balances || { USD: 0, EUR: 0, MM: 0 });

                    // Fetch transactions & pending verifications
                    const [txHistory, pendingVers] = await Promise.all([
                        api.getTransactions(userData.walletId, token), // Assumes api.getTransactions exists
                        api.getPendingVerifications(3, token) // Assumes api.getPendingVerifications exists
                    ]);
                    setTransactions(txHistory);
                    setPendingVerifications(pendingVers);

                } else {
                    console.error("User data fetched, but walletId is missing:", userData);
                    setCurrentWallet(null);
                    setBalance({ USD: 0, EUR: 0, MM: 0 });
                    setTransactions([]);
                    setPendingVerifications([]);
                }
            } catch (error) {
                console.error('Error initializing from token:', error);
                // Clear sensitive info on error
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
                setCurrentWallet(null);
                setBalance({ USD: 0, EUR: 0, MM: 0 });
                setTransactions([]);
                setPendingVerifications([]);
                setTransientPrivateKey(null); // Clear private key state on error
            } finally {
                setLoading(false);
            }
        } else {
            // No token: Clear all state including private key
            setLoading(false);
            setUser(null);
            setCurrentWallet(null);
            setBalance({ USD: 0, EUR: 0, MM: 0 });
            setTransactions([]);
            setPendingVerifications([]);
            setToken(null);
            setTransientPrivateKey(null); // Clear private key state
        }
    };
    initializeFromToken();
  }, [token]); // Re-run only when token changes


  // --- Login function ---
  // Login only returns token and user data, NOT the private key
  const login = async (email, password) => {
    try {
      // api.login now calls POST /api/auth/login via your api service
      const result = await api.login(email, password);
      localStorage.setItem('token', result.token);
      setToken(result.token); // Triggers initializeFromToken
      // DO NOT expect private key here
      setTransientPrivateKey(null); // Ensure any previous key state is cleared on login
      return result;
    } catch (error) {
      console.error('Login error:', error);
      setTransientPrivateKey(null); // Clear key state on error
      throw error;
    }
  };

  // --- Signup function (MODIFIED) ---
  // Now expects privateKey in the result and stores it temporarily
  const signup = async (email, password, name) => {
    try {
      // api.signup now calls POST /api/auth/signup via your api service
      const result = await api.signup(email, password, name); // Assumes api.signup makes the call

      // --- Store token and SET private key ---
      localStorage.setItem('token', result.token);
      if (result.privateKey) {
          console.log("Received private key on signup, storing temporarily in state.");
          setTransientPrivateKey(result.privateKey); // Store in temporary state
          // SECURITY WARNING: Remove from localStorage immediately if it was ever stored there
          // localStorage.removeItem('privateKey');
      } else {
           console.error("Signup successful but private key missing from response!");
           // Handle this error state - maybe force logout?
           setTransientPrivateKey(null);
           // Optionally throw an error or clear token?
           // throw new Error("Signup failed: Private key not received.");
      }
      setToken(result.token); // Triggers initializeFromToken
      // ------------------------------------
      return result; // Return original result (excluding private key if desired)
    } catch (error) {
      console.error('Signup error:', error);
      setTransientPrivateKey(null); // Clear key state on error
      throw error;
    }
  };

  // --- Logout function (MODIFIED) ---
  const logout = () => {
    console.log("Logging out...");
    localStorage.removeItem('token');
    setToken(null); // Triggers initializeFromToken to clear user/wallet/tx state
    setTransientPrivateKey(null); // --- Explicitly clear private key state ---
  };

  // --- addTransaction (MODIFIED) ---
  // Now needs to get the private key from state, not localStorage
  const addTransaction = async (transactionDetails) => {
    try {
      // --- Get private key from state ---
      if (!transientPrivateKey) {
          throw new Error('Private key not available in application state. Please login again or restore wallet.');
      }
       // --------------------------------
      if (!currentWallet || !token) {
        throw new Error('No active wallet or not authenticated');
      }

      // Payload construction remains the same
      const apiPayload = {
          amount: transactionDetails.amount,
          currency: transactionDetails.currency,
          recipientWalletId: transactionDetails.recipient,
          note: transactionDetails.note || '',
          timestamp: transactionDetails.timestamp,
          signature: transactionDetails.signature, // Signature already generated by SendMoney component
      };

      // api.createTransaction calls POST /api/transactions
      const result = await api.createTransaction(apiPayload, token);
      console.log('addTransaction API call successful:', result);

      // Refresh data to see the new transaction and updated balance
      await refreshData(); // Refresh after successful send

      return result.transaction;
    } catch (error) {
      console.error('Transaction failed (addTransaction context):', error);
      throw error;
    }
  };

  // --- verifyTransaction (MODIFIED) ---
  // Needs to call the new backend endpoint
  const verifyTransaction = async (transactionId) => {
    try {
      if (!token) { // Check only for token, wallet isn't strictly needed for verification API call
        throw new Error('Not authenticated');
      }

      // --- Make API call to backend verify endpoint ---
      // Assumes you create an api.submitVerification function in src/services/api.js
      // This function should make a POST request to '/api/transactions/verify' (or your chosen path)
      // sending { transactionId } in the body and the auth token.
      console.log(`Context: Calling API to submit verification for ${transactionId}`);
      const result = await api.submitVerification(transactionId, token); // Pass ID and token
      console.log('Verification submission API call successful:', result);
      // ----------------------------------------------

      // Remove from pending locally immediately for better UX
      // Note: The backend now handles the state change, but removing locally gives instant feedback
      setPendingVerifications(current =>
        current.filter(v => (v.id || v._id || v.transactionId) !== transactionId)
      );

      // Refresh data to get updated MM balance (reward) and potentially new pending txns
      await refreshData();

      return result.rewardCredited; // Return reward amount from API response
    } catch (error) {
      console.error('Verification submission failed (context):', error);
      // Consider providing more specific feedback based on error type
      alert(`Verification failed: ${error.response?.data?.error || error.message}`); // Show error from API if possible
      throw error; // Re-throw for component handling if needed
    }
  };

  // --- Refresh data manually (Your function - potentially update to fetch less?) ---
  const refreshData = async () => {
      // Check if essential data is missing before attempting refresh
      if (!token || loading) { // Removed wallet check, as refresh might be needed even without wallet (e.g., after logout error)
          console.log("Skipping refresh:", { hasToken: !!token, isLoading: loading });
          return;
      }
      // Only proceed if we have a token
      console.log("Refreshing data manually...");
      setLoading(true);
      try {
          // Fetch user data first
          const userData = await api.getUserData(token);
          setUser(userData); // Update user state

          // Conditionally fetch wallet-specific data
          if (userData && userData.walletId) {
              const [walletData, txHistory, pendingVers] = await Promise.all([
                  api.getWallet(userData.walletId, token),
                  api.getTransactions(userData.walletId, token),
                  api.getPendingVerifications(3, token)
              ]);
              console.log("Refreshed Data:", { walletData, txHistory, pendingVers });

              setCurrentWallet(walletData); // Update wallet
              setBalance(walletData.balances || { USD: 0, EUR: 0, MM: 0 });
              setTransactions(txHistory);
              setPendingVerifications(pendingVers);
          } else {
              // User exists but no wallet, clear wallet-specific state
               console.log("Refresh: User found but no walletId, clearing wallet state.");
               setCurrentWallet(null);
               setBalance({ USD: 0, EUR: 0, MM: 0 });
               setTransactions([]);
               setPendingVerifications([]);
          }
      } catch (error) {
          console.error('Error refreshing data:', error);
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
              console.log("Token potentially expired or invalid during refresh, logging out.");
              logout(); // Call logout to clear everything
          }
          // Keep existing data on non-auth errors during refresh? Or clear? Current setup keeps it.
      } finally {
          setLoading(false);
      }
  };


  // --- setTheme (Your function) ---
  const setTheme = (newTheme) => { /* ... */ };

  // --- updateLocalUser (Your function) ---
  const updateLocalUser = (updatedUserData) => { /* ... */ };


  // Value object provided to consumers of the context
  const value = {
    user,
    token,
    // --- Expose private key state ---
    transientPrivateKey,
    // ------------------------------
    balance,
    selectedCurrency,
    setSelectedCurrency,
    transactions,
    pendingVerifications,
    currentWallet,
    loading,
    theme,
    setTheme,
    login,
    signup,
    logout,
    addTransaction,
    verifyTransaction,
    refreshData,
    updateLocalUser
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook for using the context
export const useApp = () => { /* ... */ };