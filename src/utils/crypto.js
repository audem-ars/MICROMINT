// src/utils/crypto.js
// Browser-compatible crypto utilities

// Generate a random hex string
export function generateRandomHex(length = 32) {
  let result = '';
  const characters = 'abcdef0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Replacement for crypto.randomBytes().toString('hex')
export function randomBytesHex(byteLength = 16) {
  return generateRandomHex(byteLength * 2);
}

// Add the missing signMessage function
export function signMessage(message) {
  // Simple implementation - in a real app you'd use a proper signing algorithm
  const signature = 'sig_' + generateRandomHex(32);
  return signature;
}