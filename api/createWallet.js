// api/createWallet.js
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Initialize MongoDB client
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const data = req.body;
    const name = data.name || 'Default Wallet';
    
    // Generate wallet ID
    const id = 'mm_' + Date.now() + crypto.randomBytes(4).toString('hex');
    
    // Generate keypair (in a real implementation, the private key would be generated client-side)
    const privateKey = 'sk_' + crypto.randomBytes(32).toString('hex');
    const publicKey = 'pk_' + crypto.randomBytes(32).toString('hex');
    
    // Create wallet
    const wallet = {
      id,
      name,
      created: new Date().toISOString(),
      publicKey,
      privateKey // In a real system, this wouldn't be stored or returned
    };
    
    // Store in database
    await db.collection('wallets').insertOne(wallet);
    
    // Initialize balances with some starting funds for demo purposes
    const initialBalances = [
      { walletId: id, currency: 'USD', amount: 1000 },
      { walletId: id, currency: 'EUR', amount: 750 },
      { walletId: id, currency: 'MM', amount: 100 }
    ];
    
    await db.collection('balances').insertMany(initialBalances);
    
    return res.status(200).json({
      message: 'Wallet created successfully',
      wallet: {
        id: wallet.id,
        name: wallet.name,
        created: wallet.created,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey // Again, in a real system, this wouldn't be returned
      }
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};