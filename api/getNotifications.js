// api/getNotifications.js
const { MongoClient } = require('mongodb');
const { authenticateUser } = require('./middleware/auth');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
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
    
    // Get notifications for this wallet
    const notifications = await db.collection('notifications')
      .find({ walletId: auth.user.walletId })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();
    
    // Mark as read
    if (req.query.markRead === 'true') {
      await db.collection('notifications').updateMany(
        { walletId: auth.user.walletId, read: false },
        { $set: { read: true } }
      );
    }
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};