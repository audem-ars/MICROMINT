// api/createTransaction.js
const { MongoClient } = require('mongodb');
const crypto = require('crypto'); // Still needed for txId generation
const nacl = require('tweetnacl'); // Added for signature verification
const util = require('tweetnacl-util'); // Added for encoding/decoding with nacl
const jwt = require('jsonwebtoken'); // Assuming JWT is used based on auth context

// MongoDB connection string and DB Name
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'micromint'; // Use env var or default
const JWT_SECRET = process.env.JWT_SECRET; // JWT secret from environment variables

// --- Helper Functions ---

// Middleware-like function for authentication (remains the same)
const authenticateUser = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }
  if (!JWT_SECRET) {
    console.error("JWT_SECRET environment variable is not set.");
    return { authenticated: false, error: 'Server configuration error' };
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Assuming token payload contains user details like walletId
    return { authenticated: true, user: decoded };
  } catch (error) {
    console.error("Token verification error:", error.message);
    return { authenticated: false, error: 'Invalid or expired token' };
  }
};

// Verify digital signature using tweetnacl (remains the same)
const verifySignature = (message, signatureBase64, publicKeyBase64) => {
  try {
    const signature = util.decodeBase64(signatureBase64);
    const publicKey = util.decodeBase64(publicKeyBase64);
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    const messageUint8 = util.decodeUTF8(messageString);
    return nacl.sign.detached.verify(messageUint8, signature, publicKey);
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
};

// --- API Handler ---

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Authenticate User
  const auth = await authenticateUser(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error || 'Authentication failed' });
  }
  if (!auth.user || !auth.user.walletId) {
    return res.status(401).json({ error: 'Invalid authentication token payload' });
  }
  const senderWalletId = auth.user.walletId;

  // Initialize MongoDB client
  if (!MONGODB_URI) {
      console.error("MONGODB_URI environment variable is not set.");
      return res.status(500).json({ error: 'Server configuration error' });
  }
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const walletsCollection = db.collection('wallets');
    const balancesCollection = db.collection('balances');
    const transactionsCollection = db.collection('transactions');
    const tipsCollection = db.collection('tips');

    // 2. Parse and Validate Input Data
    const data = req.body;
    if (!data || typeof data !== 'object') {
         return res.status(400).json({ error: 'Invalid request body' });
    }
    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0 ||
        !data.currency || typeof data.currency !== 'string' ||
        !data.recipientWalletId || typeof data.recipientWalletId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid required fields (amount, currency, recipientWalletId)' });
    }
    if (!data.signature || typeof data.signature !== 'string' ||
        !data.timestamp || typeof data.timestamp !== 'string') {
       return res.status(400).json({ error: 'Missing signature or timestamp' });
    }

    // 3. Fetch Sender's Public Key
    const senderWallet = await walletsCollection.findOne({ walletId: senderWalletId });
    if (!senderWallet || !senderWallet.publicKey) {
      console.error(`Public key not found for walletId: ${senderWalletId}`);
      return res.status(400).json({ error: 'Sender wallet information not found or incomplete.' });
    }
    const senderPublicKey = senderWallet.publicKey;

    // 4. Verify Signature
    const messageToVerify = {
      amount: data.amount,
      currency: data.currency,
      recipient: data.recipientWalletId,
      note: data.note || '',
      timestamp: data.timestamp
    };
    const signatureValid = verifySignature(
      messageToVerify,
      data.signature,
      senderPublicKey
    );
    if (!signatureValid) {
      console.warn(`Invalid signature attempt for wallet ${senderWalletId}. Data: ${JSON.stringify(messageToVerify)}`);
      return res.status(400).json({ error: 'Invalid transaction signature' });
    }

    // --- Signature is Valid - Proceed ---

    // 5. Check Sender's Balance
    const balance = await balancesCollection.findOne({
      walletId: senderWalletId,
      currency: data.currency
    });
    if (!balance || balance.amount < data.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 6. Get Tips for Verification
    const tipsToVerify = await tipsCollection.find({}).limit(3).toArray();
    if (tipsToVerify.length < 1) {
        console.warn("Not enough tips available to reference for new transaction.");
        // Decide how critical this is - maybe proceed anyway?
    }

    // 7. Generate Transaction ID
    const txId = 'tx_' + Date.now() + crypto.randomBytes(4).toString('hex');

    // 8. Create Transaction Object
    const transaction = {
      id: txId,
      amount: data.amount,
      currency: data.currency,
      senderWalletId,
      recipientWalletId: data.recipientWalletId,
      note: data.note || '',
      timestamp: data.timestamp,
      references: tipsToVerify.map(tip => tip.transactionId),
      signature: data.signature,
      status: 'pending'
    };

    // --- Perform Database Operations ---
    // Use a transaction if your DB supports it for atomicity (optional but recommended)
    // const session = client.startSession();
    // try {
    //   await session.withTransaction(async () => {
          // 9. Store Transaction
          await transactionsCollection.insertOne(transaction /*, { session }*/);
          // 10. Add to Tips
          await tipsCollection.insertOne({ transactionId: txId, createdAt: new Date() } /*, { session }*/);
          // 11. Process Referenced Tips
          for (const tip of tipsToVerify) {
            await transactionsCollection.updateOne(
              { id: tip.transactionId, status: 'pending' },
              { $addToSet: { verifiedByIds: txId }, $set: { lastVerifiedAt: new Date() } }
              /*, { session }*/
            );
            await tipsCollection.deleteOne({ transactionId: tip.transactionId } /*, { session }*/);
          }
          // 12. Deduct from Sender
          await balancesCollection.updateOne(
            { walletId: senderWalletId, currency: data.currency },
            { $inc: { amount: -data.amount } }
            /*, { session }*/
          );
          // 13. Add to Recipient
          await balancesCollection.updateOne(
            { walletId: data.recipientWalletId, currency: data.currency },
            { $inc: { amount: data.amount } },
            { upsert: true }
            /*, { session }*/
          );
    //   });
    // } finally {
    //   await session.endSession();
    // }
    // --- End DB Operations ---


    // --- Emit WebSocket Events (AFTER successful DB operations) ---
    // Check if the Socket.IO server instance is attached to the request
    if (req.socket && req.socket.server && req.socket.server.io) {
      const io = req.socket.server.io;
      try {
          // Notify sender (assuming sender is in a room named after their wallet ID)
          io.to(transaction.senderWalletId).emit('transaction-created', transaction);
          console.log(`Emitted 'transaction-created' to room: ${transaction.senderWalletId}`);

          // Notify recipient (assuming recipient is in a room named after their wallet ID)
          io.to(transaction.recipientWalletId).emit('transaction-received', transaction);
          console.log(`Emitted 'transaction-received' to room: ${transaction.recipientWalletId}`);

          // Notify all clients about new verification opportunity (new tip added)
          io.emit('new-verification', {
              transactionId: transaction.id,
              amount: transaction.amount,
              currency: transaction.currency
          });
          console.log(`Emitted 'new-verification' globally.`);

      } catch (wsError) {
          // Log WebSocket errors but don't fail the HTTP request
          console.error("WebSocket emission error:", wsError);
      }
    } else {
      // Log if Socket.IO instance wasn't found, indicates a potential setup issue
      console.warn("Socket.IO server instance not found on req.socket.server.io. Cannot emit WebSocket events.");
    }
    // --- End WebSocket Events ---


    // --- Transaction Processing Complete ---
    // Send success response back to the original HTTP request
    return res.status(200).json({
      message: 'Transaction submitted successfully and is pending verification.',
      transactionId: txId, // Return the new transaction ID
      verifiedTipCount: tipsToVerify.length // Inform client how many tips were referenced
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    // Avoid leaking detailed error messages to the client in production
    return res.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    // Ensure the client connection is closed
    if (client) {
        await client.close();
    }
  }
};