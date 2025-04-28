// src/services/api.js

const API_BASE = '/api'; // Your API base path

// Helper function for API requests (Keep your existing helper)
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
   // console.log(`API Request: ${config.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : '');

  try {
       const response = await fetch(url, config); // Use the constructed URL

       // Try to parse JSON regardless of status for error messages
       let responseData = {};
       try {
           responseData = await response.json();
       } catch (e) {
           // If JSON parsing fails, use text body if available, or statusText
           if (!response.ok) { // Only throw if response wasn't ok
                responseData = { error: await response.text() || response.statusText };
           } else {
                responseData = {}; // Successful response with non-JSON body (unlikely for this API)
           }
       }

       // Log response status and data
       // console.log(`API Response: ${response.status} ${url}`, responseData);

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


// --- MODIFIED Authentication functions ---
export const signup = async (email, password, name) => {
  // Target /api/auth and add action query parameter
  return apiRequest('/auth?action=signup', { // <<< CHANGED PATH
    method: 'POST',
    // headers already handled by helper
    body: JSON.stringify({ email, password, name })
  });
};

export const login = async (email, password) => {
  // Target /api/auth and add action query parameter
  return apiRequest('/auth?action=login', { // <<< CHANGED PATH
    method: 'POST',
    // headers already handled by helper
    body: JSON.stringify({ email, password })
  });
};

export const getUserData = async (token) => {
  // Target /api/auth and add action query parameter
  return apiRequest('/auth?action=user', { // <<< CHANGED PATH
    method: 'GET', // Specify GET
    token: token // Pass token to helper for Authorization header
    // no body for GET
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

// Remove getBalance unless you have a specific /api/wallets/balance endpoint
// export const getBalance = async (walletId, token) => { ... };

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
    body: JSON.stringify(transaction), // Ensure body is stringified
    token: token
    // Content-Type automatically added by helper for POST with body
  });
};

export const verifyTransaction = async (transactionId, token) => {
  // Assuming /api/transactions/verify.js will exist
  return apiRequest('/transactions/verify', {
    method: 'POST',
    body: JSON.stringify({ transactionId }), // Ensure body is stringified
    token: token
    // Content-Type automatically added by helper
  });
};

export const getTransactionGraph = async (walletId, depth = 20, token) => {
   // Assuming /api/transactions/graph.js exists
  return apiRequest(`/transactions/graph?walletId=${encodeURIComponent(walletId)}&depth=${depth}`, {
    method: 'GET',
    token: token
  });
};