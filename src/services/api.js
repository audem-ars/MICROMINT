// src/services/api.js - Fixed version

const API_BASE = '/api'; // Your API base path

// Helper function for API requests (Fixed the response reading issue)
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`; // Construct full URL
  
  // Add Authorization header automatically if token exists and not disabled
  const token = options.token || localStorage.getItem('token');
  const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
  };
  
  if (token && !options.noAuth) {
      headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Delete Content-Type for GET/HEAD etc.
  if (options.method === 'GET' || options.method === 'HEAD' || !options.method) {
      delete headers['Content-Type'];
  }

  const config = {
       ...options, // Spread options first
       headers: headers, // Then override headers
   };

   // Log the request being made
   console.log(`[API] Making request: ${config.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : '');
   console.log(`[API] Request headers:`, config.headers);

  try {
       const response = await fetch(url, config);
       console.log(`[API] Response status: ${response.status} for ${url}`);

       // Clone the response to avoid "body stream already read" error
       const responseClone = response.clone();
       
       // Try to parse JSON regardless of status for error messages
       let responseData = {};
       try {
           responseData = await response.json();
           console.log(`[API] Response data:`, responseData);
       } catch (jsonError) {
           console.warn('[API] Failed to parse as JSON, trying text:', jsonError);
           // If JSON parsing fails, try text from the clone
           try {
               const textData = await responseClone.text();
               responseData = { error: textData || response.statusText };
           } catch (textError) {
               console.error('[API] Failed to parse as text too:', textError);
               responseData = { error: response.statusText || 'Unknown error' };
           }
       }

       if (!response.ok) {
           // Throw an error with details from the parsed response body
           const error = new Error(responseData.error || `HTTP error! status: ${response.status}`);
           error.response = { // Attach response details for context handling
               data: responseData,
               status: response.status,
               statusText: response.statusText
           };
           throw error;
       }

       return responseData; // Return parsed JSON data on success

  } catch (error) {
       console.error(`API Error (${options.method || 'GET'} ${url}):`, error.message);
       // Re-throw the error for components/context to handle
       throw error;
   }
};

// --- FIXED Authentication functions ---
export const signup = async (email, password, name) => {
  // FIXED: Changed from '/auth?action=signup' to '/auth?action=signup' (auth.js handles this)
  return apiRequest('/auth?action=signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });
};

export const login = async (email, password) => {
  // FIXED: Changed from '/auth?action=login' to '/auth?action=login' (auth.js handles this)
  return apiRequest('/auth?action=login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

export const getUserData = async (token) => {
  // FIXED: Changed from '/auth?action=user' to '/auth?action=user' (auth.js handles this)
  return apiRequest('/auth?action=user', {
    method: 'GET',
    token: token
  });
};

// --- Wallet and transaction functions (Keep paths as they are unless you combine them too) ---
export const getWallet = async (walletId, token) => {
  // Assuming /api/wallets/get.js exists and handles this
  return apiRequest(`/wallets/get?walletId=${encodeURIComponent(walletId)}`, {
    method: 'GET',
    token: token
  });
};

export const getTransactions = async (walletId, token) => {
  // Assuming /api/transactions/history.js exists
  return apiRequest(`/transactions/history?walletId=${encodeURIComponent(walletId)}`, {
    method: 'GET',
    token: token
  });
};

export const getPendingVerifications = async (count = 3, token) => {
   // Assuming /api/transactions/pending-verifications.js exists
  return apiRequest(`/transactions/pending-verifications?count=${count}`, {
    method: 'GET',
    token: token
  });
};

export const createTransaction = async (transaction, token) => {
   // Assuming /api/transactions/create.js exists
  return apiRequest('/transactions/create', {
    method: 'POST',
    body: JSON.stringify(transaction),
    token: token
  });
};

export const verifyTransaction = async (transactionId, token) => {
  // Assuming /api/transactions/verify.js will exist
  return apiRequest('/transactions/verify', {
    method: 'POST',
    body: JSON.stringify({ transactionId }),
    token: token
  });
};

export const getTransactionGraph = async (walletId, depth = 20, token) => {
   // Assuming /api/transactions/graph.js exists
  return apiRequest(`/transactions/graph?walletId=${encodeURIComponent(walletId)}&depth=${depth}`, {
    method: 'GET',
    token: token
  });
};

export const forgotPassword = async (email) => {
  return apiRequest('/auth?action=forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

export const resetPassword = async (token, newPassword) => {
  return apiRequest('/auth?action=reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password: newPassword })
  });
};