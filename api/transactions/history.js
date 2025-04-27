// api/transactions/history.js
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken'); // For authentication

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res) => {
  // --- 1. Check Method ---
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // --- 2. Extract Wallet ID from Query ---
  const { walletId } = req.query;
  if (!walletId) {
    return res.status(400).json({ error: 'Missing walletId query parameter' });
  }

  // --- 3. Verify Authentication ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Verify token is valid - you might optionally check if the walletId belongs to the authenticated user
    const decoded = jwt.verify(token, JWT_SECRET);
    // Optional check: if (decoded.walletId !== walletId) { return res.status(403).json({error: "Forbidden"}); }
  } catch (error) {
    return res.status(401).json({ error: `Unauthorized: ${error.message}` });
  }
  // --- End Authentication ---

  let client;
  try {
    // --- 4. Connect to Database ---
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`Connected to DB to fetch transaction history for wallet: ${walletId}`);

    // --- 5. Fetch Transactions from Database ---
    // Find transactions where the walletId is either the sender OR the recipient
    const transactions = await db.collection('transactions').find({
      $or: [
        { senderWalletId: walletId },
        { recipientWalletId: walletId }
      ]
    })
    .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
    .limit(50) // Optional: Limit the number of results for performance
    .toArray();

    console.log(`Found ${transactions.length} transactions for wallet ${walletId}`);

    // --- 6. Return Transaction History ---
    // Ensure the data format matches what the frontend expects
    return res.status(200).json(transactions); // Send the array of transactions

  } catch (error) {
    console.error(`Server error fetching transaction history for ${walletId}:`, error);
    return res.status(500).json({ error: 'Internal server error fetching transaction history' });
  } finally {
    // --- 7. Close Database Connection ---
    if (client) {
      await client.close();
      console.log(`Closed DB connection for /api/transactions/history (${walletId})`);
    }
  }
};