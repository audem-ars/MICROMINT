// api/transactions/pending-verifications.js
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res) => {
  // --- 1. Check Method ---
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // --- 2. Extract Count from Query ---
  // Default to 3 if not provided or invalid
  const count = parseInt(req.query.count, 10) || 3;

  // --- 3. Verify Authentication & Get User Info ---
  const authHeader = req.headers.authorization;
  let decoded;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  const token = authHeader.split(' ')[1];
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    // We need the user's wallet ID to exclude their own transactions
    if (!decoded.walletId) {
         return res.status(401).json({ error: 'Invalid token payload: Wallet ID missing' });
    }
  } catch (error) {
    return res.status(401).json({ error: `Unauthorized: ${error.message}` });
  }
  const userWalletId = decoded.walletId; // Get wallet ID of the requesting user
  // --- End Authentication ---


  let client;
  try {
    // --- 4. Connect to Database ---
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`Connected to DB to fetch pending verifications (excluding ${userWalletId})`);

    // --- 5. Fetch Pending Transactions ---
    // Define criteria for transactions needing verification. This is crucial and specific to your app logic.
    // Example Criteria:
    // - Status is 'pending' (or similar state indicating need for verification)
    // - Transaction is NOT sent by the current user
    // - (Optional) Transaction hasn't already been verified by this user
    // - (Optional) Number of existing verifications is less than required threshold (e.g., < 3)
    // - (Optional) Transaction is older than X minutes (to allow propagation)

    const verificationCriteria = {
      status: 'pending', // Replace with your actual status field/value
      senderWalletId: { $ne: userWalletId }, // Don't verify your own transactions
      // --- Add more specific criteria based on your app's rules ---
      // Example: Only fetch if verification count is low
      // 'verificationCount': { $lt: 3 },
      // Example: Ensure the current user hasn't already verified this one
      // 'verifiedBy': { $nin: [userWalletId] }
    };

    const pendingTransactions = await db.collection('transactions')
      .find(verificationCriteria)
      .sort({ timestamp: 1 }) // Sort by timestamp ascending (oldest first - often makes sense for verification)
      .limit(count) // Use the count from query param
      .toArray();

    console.log(`Found ${pendingTransactions.length} pending transactions for verification (limit ${count})`);

    // --- 6. Return Pending Verifications ---
    // Format the data as needed by the frontend component (e.g., just transaction IDs or full details)
    // Ensure the returned objects match what setPendingVerifications expects
    return res.status(200).json(pendingTransactions);

  } catch (error) {
    console.error(`Server error fetching pending verifications:`, error);
    return res.status(500).json({ error: 'Internal server error fetching pending verifications' });
  } finally {
    // --- 7. Close Database Connection ---
    if (client) {
      await client.close();
      console.log(`Closed DB connection for /api/transactions/pending-verifications`);
    }
  }
};