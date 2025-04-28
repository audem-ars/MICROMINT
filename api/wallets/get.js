// api/wallets/get.js
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken'); // Keep for potential future authentication

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Needed if auth uncommented

module.exports = async (req, res) => {
  // --- 1. Check Method ---
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // --- 2. Extract Wallet ID from Query ---
  const { walletId } = req.query;
  if (!walletId) {
    console.error("[API/wallets/get] Request missing walletId query parameter.");
    return res.status(400).json({ error: 'Missing walletId query parameter' });
  }

  // --- Optional: 3. Verify Authentication ---
  /* // Uncomment this section if you want to ensure only logged-in users can fetch wallet data
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[API/wallets/get] Auth header missing for wallet: ${walletId}`);
    return res.status(401).json({ error: 'Authorization header missing or invalid format' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Optional extra check: Ensure the requested walletId belongs to the authenticated user
    // if (decoded.walletId !== walletId) {
    //    console.warn(`[API/wallets/get] Auth Warning: User ${decoded.userId || decoded.walletId} attempted to fetch wallet ${walletId} (not their own).`);
    //    // Decide whether to forbid or allow fetching other wallets
    //    // return res.status(403).json({ error: 'Forbidden: You can only fetch your own wallet details.' });
    // }
    console.log(`[API/wallets/get] Authentication successful for fetching wallet: ${walletId}`);
  } catch (error) {
    console.error(`[API/wallets/get] Token verification failed for wallet ${walletId}:`, error.message);
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
    const walletsCollection = db.collection('wallets');
    console.log(`[API/wallets/get] Connected to DB. Attempting to fetch wallet: ${walletId}`);

    // --- 5. Fetch Wallet from Database ---
    // Query using the custom string 'id' field (e.g., mm_...)
    // Project only necessary fields - explicitly exclude privateKey!
    const projection = {
         _id: 0, // Exclude MongoDB default _id
         id: 1, // Include custom ID
         userId: 1,
         balances: 1,
         publicKey: 1,
         name: 1,
         created: 1
         // DO NOT INCLUDE privateKey
    };

    // Use the custom 'id' field for querying
    const wallet = await walletsCollection.findOne({ id: walletId }, { projection: projection });

    if (!wallet) {
      console.warn(`[API/wallets/get] Wallet not found in DB for ID: ${walletId}`);
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Log the raw data fetched *before* applying defaults
    console.log(`[API/wallets/get] Raw wallet data found for ID ${walletId}:`, JSON.stringify(wallet)); // Stringify for better nested object logging

    // --- 6. Construct and Return Wallet Data ---
    // Apply defaults only if fields are missing from the database document
    const responseData = {
        id: wallet.id, // Use guaranteed fields first
        userId: wallet.userId,
        publicKey: wallet.publicKey || null, // Ensure publicKey is null if missing, not undefined
        name: wallet.name || 'Unnamed Wallet', // Default name if missing
        created: wallet.created,
        balances: wallet.balances || { USD: 0, EUR: 0, MM: 0 } // Default balances object if missing
    };

    // Specific warning if publicKey was missing in the DB
    if (!wallet.publicKey) {
        console.warn(`[API/wallets/get] Wallet document for ${walletId} is missing the publicKey field in the database.`);
    }

    // Log the final data being sent in the response
    console.log(`[API/wallets/get] Returning wallet data for ID ${walletId}:`, JSON.stringify(responseData));

    return res.status(200).json(responseData);

  } catch (error) {
    console.error(`[API/wallets/get] Server error fetching wallet ${walletId}:`, error);
    // Log the full error for server-side debugging, but return a generic message
    return res.status(500).json({ error: 'Internal server error fetching wallet data' });
  } finally {
    // --- 7. Close Database Connection ---
    if (client) {
      await client.close();
      console.log(`[API/wallets/get] Closed DB connection for wallet: ${walletId}`);
    }
  }
};