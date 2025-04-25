// api/getPendingVerifications.js
const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  // Check method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get count parameter (optional)
  const count = parseInt(req.query.count || '3');
  
  // Initialize MongoDB client
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get transactions that need verification (tips)
    const tips = await db.collection('tips')
      .find({})
      .limit(count)
      .toArray();
    
    // Get the actual transactions from the tips
    const pendingVerifications = [];
    
    for (const tip of tips) {
      try {
        const transaction = await db.collection('transactions')
          .findOne({ id: tip.transactionId });
        
        if (transaction) {
          // Calculate reward (0.1% of transaction amount)
          const reward = parseFloat((transaction.amount * 0.001).toFixed(2));
          
          pendingVerifications.push({
            id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            sender: transaction.senderWalletId.substring(0, 10),
            recipient: transaction.recipientWalletId.substring(0, 10),
            date: formatRelativeTime(new Date(transaction.timestamp)),
            reward: reward
          });
        }
      } catch (txError) {
        console.error('Error getting transaction for tip:', txError);
        // Skip this one if there's an error
      }
    }
    
    return res.status(200).json(pendingVerifications);
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};

// Helper function to format timestamp to relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}