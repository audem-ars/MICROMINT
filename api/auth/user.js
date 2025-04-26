// api/auth/user.js
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateUser } = require('../middleware/auth');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const auth = await authenticateUser(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error });
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get user data
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(auth.user.userId) 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data (without password)
    return res.status(200).json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      walletId: auth.user.walletId,
      created: user.created
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    return res.status(500).json({ error: 'Failed to get user data' });
  } finally {
    await client.close();
  }
};