// src/services/api.js
const API_BASE = '/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || `Error: ${response.status}`;
    } catch (e) {
      errorMessage = `Error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Authentication functions
export const signup = async (email, password, name) => {
  return apiRequest('/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, name })
  });
};

export const login = async (email, password) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
};

export const getUserData = async (token) => {
  return apiRequest('/auth/user', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Wallet and transaction functions
export const getWallet = async (walletId, token) => {
  return apiRequest(`/getWallet?walletId=${walletId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const getBalance = async (walletId, token) => {
  return apiRequest(`/getBalance?walletId=${walletId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const getTransactions = async (walletId, token) => {
  return apiRequest(`/getTransactions?walletId=${walletId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const getPendingVerifications = async (count = 3, token) => {
  return apiRequest(`/getPendingVerifications?count=${count}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const createTransaction = async (transaction, token) => {
  return apiRequest('/createTransaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(transaction)
  });
};

export const verifyTransaction = async (transactionId, token) => {
  return apiRequest('/verifyTransaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ transactionId })
  });
};

// Graph visualization
export const getTransactionGraph = async (walletId, depth = 20, token) => {
  return apiRequest(`/getTransactionGraph?walletId=${walletId}&depth=${depth}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};