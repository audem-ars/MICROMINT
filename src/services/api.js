// src/services/api.js
const API_BASE = '/api';

export const createWallet = async (name) => {
  const response = await fetch(`${API_BASE}/createWallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create wallet');
  }
  
  return response.json();
};

export const getWallet = async (walletId) => {
  const response = await fetch(`${API_BASE}/getWallet?walletId=${walletId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get wallet');
  }
  
  return response.json();
};

export const getBalance = async (walletId) => {
  const response = await fetch(`${API_BASE}/getBalance?walletId=${walletId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get balance');
  }
  
  return response.json();
};

export const getTransactions = async (walletId) => {
  const response = await fetch(`${API_BASE}/getTransactions?walletId=${walletId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get transactions');
  }
  
  return response.json();
};

export const getPendingVerifications = async (count = 3) => {
  const response = await fetch(`${API_BASE}/getPendingVerifications?count=${count}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get pending verifications');
  }
  
  return response.json();
};

export const createTransaction = async (transaction) => {
  const response = await fetch(`${API_BASE}/createTransaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create transaction');
  }
  
  return response.json();
};

export const verifyTransaction = async (transactionId, verifierWalletId) => {
  const response = await fetch(`${API_BASE}/verifyTransaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionId,
      verifierWalletId
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify transaction');
  }
  
  return response.json();
};