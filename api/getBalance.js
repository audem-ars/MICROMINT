// api/getBalance.js
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
    
    // Query balances for this wallet
    const balanceRecords = await db.collection('balances')
      .find({ walletId: walletId })
      .toArray();
    
    // Format balances as a simple object
    const balances = {};
    
    balanceRecords.forEach(record => {
      balances[record.currency] = record.amount;
    });
    
    // Ensure we have all standard currencies, even if zero balance
    const standardCurrencies = ['USD', 'EUR', 'MM'];
    standardCurrencies.forEach(currency => {
      if (balances[currency] === undefined) {
        balances[currency] = 0;
      }
    });
    
    return res.status(200).json(balances);
  } catch (error) {
    console.error('Error getting balance:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};