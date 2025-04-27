// src/api-client.js
// API client functions for interacting with the backend

// Auth API calls
export const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  export const signup = async (email, password, name) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };
  
  export const getCurrentUser = async (token) => {
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  };
  
  // Transaction API calls
  export const createTransaction = async (token, transactionData) => {
    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  };
  
  export const verifyTransaction = async (token, transactionId) => {
    try {
      const response = await fetch('/api/transactions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ transactionId }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Verify transaction error:', error);
      throw error;
    }
  };
  
  export const getTransactionHistory = async (token, walletId = null) => {
    try {
      const url = walletId 
        ? `/api/transactions/history?walletId=${walletId}` 
        : '/api/transactions/history';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get transaction history error:', error);
      throw error;
    }
  };
  
  export const getPendingVerifications = async (token, count = 3) => {
    try {
      const response = await fetch(`/api/transactions/pending-verifications?count=${count}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get pending verifications error:', error);
      throw error;
    }
  };
  
  export const getTransactionGraph = async (token, depth = 10, startTxId = null) => {
    try {
      let url = `/api/transactions/graph?depth=${depth}`;
      if (startTxId) {
        url += `&startTxId=${startTxId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get transaction graph error:', error);
      throw error;
    }
  };
  
  // Wallet API calls
  export const getWallet = async (token, walletId = null) => {
    try {
      const url = walletId 
        ? `/api/wallets/get?walletId=${walletId}` 
        : '/api/wallets/get';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get wallet error:', error);
      throw error;
    }
  };
  
  export const getWalletBalance = async (token, walletId = null) => {
    try {
      const url = walletId 
        ? `/api/wallets/balance?walletId=${walletId}` 
        : '/api/wallets/balance';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return await response.json();
    } catch (error) {
      console.error('Get wallet balance error:', error);
      throw error;
    }
  };