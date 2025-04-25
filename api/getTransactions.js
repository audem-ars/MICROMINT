// api/getTransactions.js
const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  // Check method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get walletId from query parameters
  const walletId = req.query.walletId;
  
  if (!walletId) {
    return res.status(400).json({ error: 'Missing walletId parameter' });
  }
  
  // Initialize MongoDB client
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Query transactions
    const [sent, received, verifications] = await Promise.all([
      // Sent transactions
      db.collection('transactions')
        .find({ senderWalletId: walletId })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray(),
      
      // Received transactions
      db.collection('transactions')
        .find({ recipientWalletId: walletId })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray(),
      
      // Verification rewards
      db.collection('transactions')
        .find({ type: 'verify', recipientWalletId: walletId })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray()
    ]);
    
    // Combine and format transactions
    const allTransactions = [
      ...sent.map(tx => ({ ...tx, type: 'send' })),
      ...received.map(tx => ({ ...tx, type: 'receive' })),
      ...verifications.map(tx => ({ ...tx, type: 'verify' }))
    ];
    
    // Sort by timestamp (newest first)
    allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return res.status(200).json(allTransactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};