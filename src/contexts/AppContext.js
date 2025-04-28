// src/contexts/AppContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// REMOVED: import io from 'socket.io-client'; // Assuming still removed
import * as api from '../services/api'; // Assuming api.js handles the actual fetch calls

// Create the context
// --- Provide a default shape to potentially help initial render ---
const AppContext = createContext({
    user: null,
    token: null,
    transientPrivateKey: null,
    balance: { USD: 0, EUR: 0, MM: 0 },
    selectedCurrency: 'USD',
    setSelectedCurrency: () => {},
    transactions: [],
    pendingVerifications: [],
    currentWallet: null,
    loading: true,
    theme: 'light',
    setTheme: () => {},
    login: async () => {},
    signup: async () => {},
    logout: () => {},
    addTransaction: async () => {},
    verifyTransaction: async () => {},
    refreshData: async () => {},
    updateLocalUser: () => {},
});

// Helper function to get initial theme
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
      return storedTheme;
    }
  }
  return 'light'; // Default theme
};

// Provider component
export const AppProvider = ({ children }) => {
  const [currentWallet, setCurrentWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [transientPrivateKey, setTransientPrivateKey] = useState(null); // In-memory key state
  const [balance, setBalance] = useState({ USD: 0, EUR: 0, MM: 0 });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactions, setTransactions] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true); // Start loading initially
  const [theme, setThemeState] = useState(getInitialTheme);

  // --- Theme Effect ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light'); // Ensure only one class
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  // --- Initialize from token Effect with Detailed Logging ---
  useEffect(() => {
    const initializeFromToken = async () => {
        console.log("[EFFECT START] initializeFromToken triggered. Token:", token); // Log start and token value

        if (token) {
            console.log("[EFFECT] Token exists. Setting loading = true.");
            setLoading(true); // Set loading true *before* try block
            let fetchedUserData = null; // Variable to hold user data

            try {
                console.log("[EFFECT try] Attempting api.getUserData...");
                fetchedUserData = await api.getUserData(token); // Fetch user data
                console.log("[EFFECT try] api.getUserData SUCCESS. UserData:", fetchedUserData);
                setUser(fetchedUserData); // Set user state

                if (fetchedUserData && fetchedUserData.walletId) {
                    console.log("[EFFECT try] User has walletId. Attempting Promise.all for wallet, tx, pending...");
                    const [walletData, txHistory, pendingVers] = await Promise.all([
                        api.getWallet(fetchedUserData.walletId, token),
                        api.getTransactions(fetchedUserData.walletId, token),
                        api.getPendingVerifications(3, token)
                    ]);
                    console.log("[EFFECT try] Promise.all SUCCESS. WalletData:", walletData, "TxHistory:", txHistory, "PendingVers:", pendingVers);
                    // --- Check if component is still mounted before setting state ---
                    // (Requires adding an isMounted check if strict cancellation needed)
                    setCurrentWallet(walletData);
                    setBalance(walletData.balances || { USD: 0, EUR: 0, MM: 0 });
                    setTransactions(txHistory);
                    setPendingVerifications(pendingVers);
                    console.log("[EFFECT try] State updated successfully after Promise.all.");

                } else {
                    console.warn("[EFFECT try] User data fetched, but NO walletId found. Clearing wallet state.");
                    setCurrentWallet(null);
                    setBalance({ USD: 0, EUR: 0, MM: 0 });
                    setTransactions([]);
                    setPendingVerifications([]);
                }

            } catch (error) {
                console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.error("[EFFECT catch] ERROR during initial data fetch:", error);
                console.error("Error Name:", error.name);
                console.error("Error Message:", error.message);
                // Log details from API error if available
                console.error("Error Response Status:", error.response?.status);
                console.error("Error Response Data:", error.response?.data);
                console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

                // Clear state on error
                localStorage.removeItem('token');
                setToken(null); // Setting token to null WILL re-trigger this effect, leading to the "No token" branch below
                setUser(null);
                setCurrentWallet(null);
                setBalance({ USD: 0, EUR: 0, MM: 0 });
                setTransactions([]);
                setPendingVerifications([]);
                setTransientPrivateKey(null);
            } finally {
                // This block *always* runs after try or catch
                console.log("[EFFECT finally] Reached finally block. Setting loading = false.");
                setLoading(false); // Ensure loading is set to false
            }
        } else {
            // No token case
            console.log("[EFFECT] No token found. Setting loading = false and clearing state.");
            setLoading(false); // Set loading false
            setUser(null);
            setCurrentWallet(null);
            setBalance({ USD: 0, EUR: 0, MM: 0 });
            setTransactions([]);
            setPendingVerifications([]);
            setToken(null); // Ensure token is null if not found initially
            setTransientPrivateKey(null);
        }
    };

    initializeFromToken();
  }, [token]); // Re-run only when token changes


  // --- Login function ---
  const login = async (email, password) => {
    try {
      const result = await api.login(email, password);
      localStorage.setItem('token', result.token);
      setTransientPrivateKey(null); // Clear any old key on login
      setToken(result.token); // Triggers initializeFromToken
      return result;
    } catch (error) {
      console.error('Login error:', error);
      setTransientPrivateKey(null);
      throw error;
    }
  };

  // --- Signup function ---
  const signup = async (email, password, name) => {
    try {
      const result = await api.signup(email, password, name);
      localStorage.setItem('token', result.token);
      if (result.privateKey) {
          console.log("Received private key on signup, storing temporarily in state.");
          setTransientPrivateKey(result.privateKey);
      } else {
           console.error("Signup successful but private key missing from response!");
           setTransientPrivateKey(null);
           // Potentially throw new Error("Signup failed: Private key not received.");
      }
      setToken(result.token); // Triggers initializeFromToken
      return result; // Return original result maybe without private key?
    } catch (error) {
      console.error('Signup error:', error);
      setTransientPrivateKey(null);
      throw error;
    }
  };

  // --- Logout function ---
  const logout = () => {
    console.log("Logging out...");
    localStorage.removeItem('token');
    setToken(null); // Triggers initializeFromToken to clear user/wallet/tx state
    setTransientPrivateKey(null); // Clear private key state
  };

  // --- addTransaction ---
  const addTransaction = async (transactionDetails) => {
    try {
      if (!transientPrivateKey) {
          throw new Error('Private key not available in application state. Please login again or restore wallet.');
      }
      if (!currentWallet || !token) {
        throw new Error('No active wallet or not authenticated');
      }
      // Signature is generated in SendMoney component before calling this
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
      await refreshData(); // Refresh after successful send
      return result.transaction;
    } catch (error) {
      console.error('Transaction failed (addTransaction context):', error);
      throw error;
    }
  };

  // --- verifyTransaction ---
  const verifyTransaction = async (transactionId) => {
      try {
        if (!token) {
          throw new Error('Not authenticated');
        }
        console.log(`Context: Calling API to submit verification for ${transactionId}`);
        const result = await api.verifyTransaction(transactionId, token); // Use existing function from api.js
        console.log('Verification submission API call successful:', result);

        setPendingVerifications(current =>
          current.filter(v => (v.id || v._id || v.transactionId) !== transactionId)
        );
        await refreshData();
        return result.rewardCredited || 0;

      } catch (error) {
        console.error('Verification submission failed (context):', error);
        alert(`Verification failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        throw error;
      }
    };

  // --- Refresh data manually ---
  const refreshData = async () => {
      if (!token || loading) {
          console.log("Skipping refresh:", { hasToken: !!token, isLoading: loading });
          return;
      }
      console.log("Refreshing data manually...");
      setLoading(true);
      try {
          const userData = await api.getUserData(token);
          setUser(userData);
          if (userData && userData.walletId) {
              const [walletData, txHistory, pendingVers] = await Promise.all([
                  api.getWallet(userData.walletId, token),
                  api.getTransactions(userData.walletId, token),
                  api.getPendingVerifications(3, token)
              ]);
              console.log("Refreshed Data:", { walletData, txHistory, pendingVers });
              setCurrentWallet(walletData);
              setBalance(walletData.balances || { USD: 0, EUR: 0, MM: 0 });
              setTransactions(txHistory);
              setPendingVerifications(pendingVers);
          } else {
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
              logout();
          }
      } finally {
          setLoading(false);
      }
  };


  // --- setTheme ---
  const setTheme = (newTheme) => {
    if (['light', 'dark'].includes(newTheme)) {
        setThemeState(newTheme);
        // Also apply the class to the HTML element here or rely on the useEffect
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
    }
  };

  // --- updateLocalUser ---
  const updateLocalUser = (updatedUserData) => {
      setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };


  // Value object provided to consumers of the context
  const value = {
    user,
    token,
    transientPrivateKey, // Provide the in-memory private key
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
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    // This check helps catch if the Provider isn't wrapping correctly
    console.error("useApp() called outside of AppProvider!");
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};