// api/wallets/get.js
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken'); // If you want to protect this endpoint

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
// Optional: Use JWT_SECRET if you require authentication to view wallet details
// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

  // --- Optional: 3. Verify Authentication ---
  /*
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET); // Verify token is valid
  } catch (error) {
    return res.status(401).json({ error: `Unauthorized: ${error.message}` });
  }
  */
  // --- End Optional Authentication ---


  let client;
  try {
    // --- 4. Connect to Database ---
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`Connected to DB to fetch wallet: ${walletId}`);

    // --- 5. Fetch Wallet from Database ---
    // Query using the custom string 'id' field where your mm_... ID is stored
    const wallet = await db.collection('wallets').findOne({ id: walletId });
    // DO NOT query using _id unless walletId is the MongoDB ObjectId string

    if (!wallet) {
      console.warn(`Wallet not found in DB: ${walletId}`);
      return res.status(404).json({ error: 'Wallet not found' });
    }
    console.log(`Wallet found for ID ${walletId}:`, wallet);

    // --- 6. Return Wallet Data ---
    // Make sure to return the data in the format expected by the frontend AppContext
    // Especially the 'balances' object and the 'id' field.
    return res.status(200).json({
        id: wallet.id, // Ensure the string ID is returned
        userId: wallet.userId,
        balances: wallet.balances || { USD: 0, EUR: 0, MM: 0 }, // Provide default balances
        // Add any other relevant wallet fields
    });

  } catch (error) {
    console.error(`Server error fetching wallet ${walletId}:`, error);
    return res.status(500).json({ error: 'Internal server error fetching wallet data' });
  } finally {
    // --- 7. Close Database Connection ---
    if (client) {
      await client.close();
      console.log(`Closed DB connection for /api/wallets/get (${walletId})`);
    }
  }
};