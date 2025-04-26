// src/crypto-utils.js

// Provides browser-compatible replacements for crypto functions we need
export const generateRandomId = (prefix = '', length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate a simple "random" hex string (not cryptographically secure, but fine for demo)
export const generateRandomHex = (length = 32) => {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};