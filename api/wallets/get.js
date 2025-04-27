// api/wallets/get.js
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken'); // Keep if you plan to add authentication later

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
  /* // Uncomment this section if you want to ensure only logged-in users can fetch wallet data
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid format' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Optional extra check: Ensure the requested walletId belongs to the authenticated user
    // if (decoded.walletId !== walletId) {
    //    console.warn(`Auth Warning: User ${decoded.userId} attempted to fetch wallet ${walletId} (not their own).`);
    //    // Decide whether to forbid or allow fetching other wallets
    //    // return res.status(403).json({ error: 'Forbidden: You can only fetch your own wallet details.' });
    // }
  } catch (error) {
    console.error("Token verification failed:", error.message);
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
    console.log(`Connected to DB to fetch wallet: ${walletId}`);

    // --- 5. Fetch Wallet from Database ---
    // Query using the custom string 'id' field (e.g., mm_...)
    // Project only necessary fields - explicitly exclude privateKey!
    const projection = {
         _id: 0, // Exclude MongoDB default _id unless needed
         id: 1,
         userId: 1,
         balances: 1,
         publicKey: 1,
         name: 1,
         created: 1
         // Explicitly DO NOT include privateKey: 0 (or just don't list it)
    };
    const wallet = await walletsCollection.findOne({ id: walletId }, { projection: projection });

    if (!wallet) {
      console.warn(`Wallet not found in DB: ${walletId}`);
      return res.status(404).json({ error: 'Wallet not found' });
    }
    // Log the wallet *after* projection to see what's being sent
    console.log(`Wallet found for ID ${walletId} (data being returned):`, wallet);

    // --- 6. Return Wallet Data ---
    // The 'wallet' object now only contains the projected fields
    // Ensure default balances if the field is missing entirely
    const responseData = {
        ...wallet, // Spread the projected fields
        balances: wallet.balances || { USD: 0, EUR: 0, MM: 0 } // Ensure balances default
    };

     if (!responseData.publicKey) {
        // Add a warning if the publicKey is missing from the database document itself
        console.warn(`Wallet document for ${walletId} is missing the publicKey field.`);
        responseData.publicKey = null; // Ensure it's explicitly null if missing
    }
     if (!responseData.name) {
        responseData.name = 'Unnamed Wallet'; // Default name
     }


    return res.status(200).json(responseData); // Return the constructed object

  } catch (error) {
    console.error(`Server error fetching wallet ${walletId}:`, error);
    return res.status(500).json({ error: 'Internal server error fetching wallet data', details: error.message });
  } finally {
    // --- 7. Close Database Connection ---
    if (client) {
      await client.close();
      console.log(`Closed DB connection for /api/wallets/get (${walletId})`);
    }
  }
};