// api/getWallet.js
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
    
    // Query wallet
    const wallet = await db.collection('wallets').findOne({ id: walletId });
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get balances
    const balanceRecords = await db.collection('balances')
      .find({ walletId: walletId })
      .toArray();
    
    // Format balances as a simple object
    const formattedBalances = {};
    
    balanceRecords.forEach(record => {
      formattedBalances[record.currency] = record.amount;
    });
    
    // Ensure we have all standard currencies, even if zero balance
    const standardCurrencies = ['USD', 'EUR', 'MM'];
    standardCurrencies.forEach(currency => {
      if (formattedBalances[currency] === undefined) {
        formattedBalances[currency] = 0;
      }
    });
    
    // Return wallet with balances
    return res.status(200).json({
      id: wallet.id,
      name: wallet.name,
      created: wallet.created,
      publicKey: wallet.publicKey,
      balances: formattedBalances
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};