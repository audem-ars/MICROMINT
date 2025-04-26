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
  const messageUint8 = util.decodeUTF8(JSON.stringify(message));
  const signature = nacl.sign.detached(messageUint8, secretKey);
  return util.encodeBase64(signature);
};

// Verify a signature
export const verifySignature = (message, signatureBase64, publicKeyBase64) => {
  const signature = util.decodeBase64(signatureBase64);
  const publicKey = util.decodeBase64(publicKeyBase64);
  const messageUint8 = util.decodeUTF8(JSON.stringify(message));
  return nacl.sign.detached.verify(messageUint8, signature, publicKey);
};