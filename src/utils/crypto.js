// src/utils/crypto.js (Frontend Utilities)
import nacl from 'tweetnacl';
import { Buffer } from 'buffer'; // Import Buffer for handling binary data consistently

// Helper to convert hex string to Uint8Array
function hexToUint8Array(hexString) {
  return new Uint8Array(Buffer.from(hexString, 'hex'));
}

// Helper to convert Uint8Array to hex string
function uint8ArrayToHex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Signs a message using Ed25519 with the provided private key.
 * Assumes keys and signature are handled as hex strings.
 * @param {object} messageData - The JS object to be signed.
 * @param {string} privateKeyHex - The private key as a hex string.
 * @returns {string} The signature as a hex string.
 * @throws {Error} If signing fails or keys are invalid.
 */
export function signMessage(messageData, privateKeyHex) {
  if (!messageData || !privateKeyHex) {
      throw new Error('Message data and private key are required for signing.');
  }
  try {
      // 1. Consistently stringify the message object (ensure order if needed, but JSON.stringify is usually ok for simple objects)
      const messageString = JSON.stringify(messageData);
      // 2. Convert the message string to bytes (UTF-8 is standard)
      const messageBytes = Buffer.from(messageString, 'utf8');
      // 3. Convert the hex private key to bytes
      //    NOTE: tweetnacl's sign.keyPair.fromSecretKey expects the 64-byte secret key.
      //    If you stored the 64-byte key from nacl.sign.keyPair().secretKey, use it directly.
      //    If you stored only the 32-byte seed, you need to generate the keypair from the seed first.
      //    Let's assume privateKeyHex is the 64-byte secret key hex string.
      const privateKeyBytes = hexToUint8Array(privateKeyHex);

      if (privateKeyBytes.length !== nacl.sign.secretKeyLength) {
          throw new Error(`Invalid private key length. Expected ${nacl.sign.secretKeyLength} bytes.`);
      }

      // 4. Sign the message bytes
      const signatureBytes = nacl.sign.detached(messageBytes, privateKeyBytes);

      // 5. Convert the signature bytes to hex string
      const signatureHex = uint8ArrayToHex(signatureBytes);

      console.log("Signing Message:", messageString); // Log what's being signed
      console.log("Signature Generated (Hex):", signatureHex);
      return signatureHex;

  } catch (error) {
       console.error("Error signing message:", error);
       throw new Error(`Signing failed: ${error.message}`); // Re-throw for component handling
  }
}

// Optional: Include key generation here if needed for client-side actions later
/**
 * Generates a new Ed25519 key pair.
 * @returns {{publicKey: string, privateKey: string}} Keys as hex strings.
 */
export function generateClientKeyPair() {
    const keyPair = nacl.sign.keyPair();
    const publicKeyHex = uint8ArrayToHex(keyPair.publicKey);
    const privateKeyHex = uint8ArrayToHex(keyPair.secretKey); // Includes private+public
    return { publicKey: publicKeyHex, privateKey: privateKeyHex };
}

// You can keep your random hex functions if used elsewhere, but they aren't crypto.
export function generateRandomHex(length = 32) { /* ... */ }
export function randomBytesHex(byteLength = 16) { /* ... */ }