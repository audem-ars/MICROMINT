// api/utils/crypto.js (Backend Utilities)
const nacl = require('tweetnacl'); // Use require for backend Node.js environment
const { Buffer } = require('buffer'); // Node's built-in Buffer

// Helper to convert hex string to Uint8Array
function hexToUint8Array(hexString) {
  // Input validation
  if (typeof hexString !== 'string' || hexString.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hexString)) {
    throw new Error('Invalid hex string provided.');
  }
  return new Uint8Array(Buffer.from(hexString, 'hex'));
}

/**
 * Verifies an Ed25519 signature.
 * Assumes keys and signature are handled as hex strings.
 * @param {string} messageString - The exact string message that was allegedly signed.
 * @param {string} signatureHex - The signature as a hex string.
 * @param {string} publicKeyHex - The sender's public key as a hex string.
 * @returns {boolean} True if the signature is valid, false otherwise.
 * @throws {Error} If verification encounters an error (e.g., invalid key/sig format).
 */
function verifySignature(messageString, signatureHex, publicKeyHex) {
   if (!messageString || !signatureHex || !publicKeyHex) {
      console.error("Verification requires message string, signature hex, and public key hex.");
      return false; // Or throw? Returning false is safer for control flow.
   }
   try {
       // 1. Convert message string to bytes (must match client encoding, usually UTF-8)
       const messageBytes = Buffer.from(messageString, 'utf8');
       // 2. Convert hex signature to bytes
       const signatureBytes = hexToUint8Array(signatureHex);
       // 3. Convert hex public key to bytes
       const publicKeyBytes = hexToUint8Array(publicKeyHex);

       // 4. Perform verification
       const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

       console.log(`Verification attempt: PK=${publicKeyHex.substring(0,10)}..., Sig=${signatureHex.substring(0,10)}..., Msg="${messageString.substring(0, 30)}...", Valid=${isValid}`);
       return isValid;

   } catch (error) {
       // Catch errors from hex conversion or nacl verification itself
       console.error("Error during signature verification:", error);
       // You might want to distinguish format errors from actual verification failures
       return false; // Treat errors during verification as invalid signature
   }
}

// Export necessary functions for backend use
module.exports = {
    verifySignature
    // Add generateKeyPair and createWalletId here if you want them centralized,
    // otherwise keep them directly in signup.js as previously shown.
};