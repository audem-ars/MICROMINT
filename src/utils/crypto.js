// src/utils/crypto.js
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Generate a new keypair
export const generateKeypair = () => {
  const keypair = nacl.sign.keyPair();
  return {
    publicKey: util.encodeBase64(keypair.publicKey),
    secretKey: util.encodeBase64(keypair.secretKey)
  };
};

// Sign a message with a secret key
export const signMessage = (message, secretKeyBase64) => {
  const secretKey = util.decodeBase64(secretKeyBase64);
  // Ensure message is stringified before encoding
  const messageString = typeof message === 'string' ? message : JSON.stringify(message);
  const messageUint8 = util.decodeUTF8(messageString);
  const signature = nacl.sign.detached(messageUint8, secretKey);
  return util.encodeBase64(signature);
};

// Verify a signature
export const verifySignature = (message, signatureBase64, publicKeyBase64) => {
  const signature = util.decodeBase64(signatureBase64);
  const publicKey = util.decodeBase64(publicKeyBase64);
  // Ensure message is stringified before encoding, matching the signMessage logic
  const messageString = typeof message === 'string' ? message : JSON.stringify(message);
  const messageUint8 = util.decodeUTF8(messageString);
  try {
    return nacl.sign.detached.verify(messageUint8, signature, publicKey);
  } catch (error) {
    console.error("Verification failed:", error);
    return false;
  }
};

// Generate a random ID with an optional prefix
export const generateRandomId = (prefix = '', length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate a random hexadecimal string
export const generateRandomHex = (length = 32) => {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};