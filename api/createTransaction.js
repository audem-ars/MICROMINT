// api/createTransaction.js
const { MongoClient } = require('mongodb');

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
    
    // Parse the transaction data
    const data = req.body;
    
    // Validate required fields
    if (!data.amount || !data.currency || !data.senderWalletId || !data.recipientWalletId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate transaction ID
    const txId = 'tx_' + Date.now() + Math.random().toString(36).substring(2, 10);
    
    // Create transaction object
    const transaction = {
      id: txId,
      amount: parseFloat(data.amount),
      currency: data.currency,
      senderWalletId: data.senderWalletId,
      recipientWalletId: data.recipientWalletId,
      note: data.note || '',
      timestamp: new Date().toISOString(),
      references: data.references || [], // Previous transactions this one references
      signature: data.signature || 'sig_' + Math.random().toString(36).substring(2, 15),
      status: 'pending' // Initially pending until verified
    };
    
    // Store transaction in database
    await db.collection('transactions').insertOne(transaction);
    
    // Add to tips collection (unverified transactions)
    await db.collection('tips').insertOne({ transactionId: txId });
    
    // Update balances (in a real system, this would happen after verification)
    // For demo purposes, we're updating immediately
    
    // Deduct from sender
    await db.collection('balances').updateOne(
      { walletId: data.senderWalletId, currency: data.currency },
      { $inc: { amount: -parseFloat(data.amount) } },
      { upsert: true }
    );
    
    // Add to recipient
    await db.collection('balances').updateOne(
      { walletId: data.recipientWalletId, currency: data.currency },
      { $inc: { amount: parseFloat(data.amount) } },
      { upsert: true }
    );
    
    return res.status(200).json({
      message: 'Transaction created successfully',
      transaction: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};