// api/verifyTransaction.js
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
    
    // Parse the verification data
    const data = req.body;
    
    // Validate required fields
    if (!data.transactionId || !data.verifierWalletId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if transaction exists and is not already verified
    const transaction = await db.collection('transactions').findOne({ id: data.transactionId });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Check if transaction is already verified
    if (transaction.verifiedBy) {
      return res.status(400).json({ error: 'Transaction already verified' });
    }
    
    // Mark transaction as verified
    await db.collection('transactions').updateOne(
      { id: data.transactionId },
      { 
        $set: {
          verifiedBy: data.verifierWalletId,
          verifiedAt: new Date().toISOString(),
          status: 'completed'
        } 
      }
    );
    
    // Remove from tips collection
    await db.collection('tips').deleteOne({ transactionId: data.transactionId });
    
    // Calculate reward (0.1% of transaction amount)
    const reward = parseFloat((transaction.amount * 0.001).toFixed(2));
    
    // Add verification reward (MM tokens) to verifier
    await db.collection('balances').updateOne(
      { walletId: data.verifierWalletId, currency: 'MM' },
      { $inc: { amount: reward } },
      { upsert: true }
    );
    
    // Create verification reward transaction
    const rewardTxId = 'tx_' + Date.now() + Math.random().toString(36).substring(2, 10);
    
    await db.collection('transactions').insertOne({
      id: rewardTxId,
      type: 'verify',
      amount: reward,
      currency: 'MM',
      senderWalletId: 'system',
      recipientWalletId: data.verifierWalletId,
      description: 'Verification reward',
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
    
    return res.status(200).json({
      message: 'Transaction verified successfully',
      reward: reward,
      transactionId: data.transactionId
    });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};