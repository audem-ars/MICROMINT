// api/auth/user.js
const { MongoClient, ObjectId } = require('mongodb'); // Import ObjectId
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint'; // Make sure this matches your actual DB name
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // MUST match the secret used in login.js

// Basic input validation (optional but recommended)
function isValidMongoId(id) {
    return ObjectId.isValid(id);
}

module.exports = async (req, res) => {
  // --- 1. Check Method ---
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']); // Inform client which methods are allowed
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // --- 2. Get and Validate Authorization Header ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid format (Bearer token required)' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
      return res.status(401).json({ error: 'Token missing from Authorization header' });
  }

  let client; // Define client outside try block for access in finally

  try {
    // --- 3. Verify JWT Token ---
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
        // Handle specific JWT errors (expired, invalid signature)
        console.error('Token verification failed:', error.message);
        // Return 401 for any token verification issue
        return res.status(401).json({ error: `Unauthorized: Invalid or expired token (${error.name})` });
    }

    const userId = decoded.userId;
    // --- 4. Validate Payload ---
    if (!userId) { // Check if userId exists in the decoded token payload
        console.error('User ID missing from token payload:', decoded);
        return res.status(401).json({ error: 'Invalid token payload: User ID missing' });
    }

    // Optional: Validate if userId looks like a valid MongoDB ObjectId before querying
    // if (!isValidMongoId(userId)) {
    //     console.error('Invalid User ID format in token:', userId);
    //     return res.status(401).json({ error: 'Invalid token payload: Malformed User ID' });
    // }


    // --- 5. Connect to Database ---
    client = new MongoClient(MONGODB_URI); // Initialize client here
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`Connected to DB to fetch user data for ID: ${userId}`); // Added log

    // --- 6. Fetch User from Database ---
    // IMPORTANT: Query using ObjectId if your _id field is stored as ObjectId
    // Ensure the userId from the token corresponds to the format in the DB
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    // If your _id is stored as a string, use:
    // const user = await db.collection('users').findOne({ _id: userId });


    if (!user) {
      // This case might mean the user was deleted after the token was issued
      console.warn(`User not found in DB for ID from valid token: ${userId}`);
      return res.status(404).json({ error: 'User associated with this token not found' });
    }
    console.log(`User found: ${user.email}`); // Added log

    // --- 7. Fetch Associated Wallet ---
    // Ensure your wallets collection has an indexed 'userId' field matching the user's _id format (string or ObjectId)
    // Here assuming wallet.userId stores the string version of the user's _id
    const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });
    // If wallet.userId stores the ObjectId, use:
    // const wallet = await db.collection('wallets').findOne({ userId: user._id });


    console.log(`Wallet search result for user ${userId}:`, wallet ? `Found wallet ID ${wallet.id}` : 'No wallet found'); // Added log


    // --- 8. Return User Data ---
    // Selectively return fields - NEVER send the password hash
    const userData = {
      id: user._id.toString(), // Always send string IDs to frontend
      email: user.email,
      name: user.name,
      // IMPORTANT: Ensure your wallet document has an 'id' field containing the string ID
      // If you only have MongoDB's '_id', use wallet._id.toString()
      walletId: wallet ? wallet.id : null
      // Add any other fields needed by the frontend (e.g., registration date, roles)
    };
    console.log('Returning user data:', userData); // Added log

    return res.status(200).json(userData); // Send only the selected data

  } catch (error) {
    // Catch any other errors (DB connection, unexpected issues)
    console.error('Server error in /api/auth/user:', error);
    // Avoid sending detailed internal error messages to the client
    return res.status(500).json({ error: 'Internal server error fetching user data' });
  } finally {
    // --- 9. Close Database Connection ---
    if (client) {
      await client.close();
      console.log('Closed DB connection for /api/auth/user'); // Added log
    }
  }
};