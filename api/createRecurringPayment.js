// api/createRecurringPayment.js
const { MongoClient } = require('mongodb');
const { authenticateUser } = require('./middleware/auth');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
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
    
    const { 
      recipientWalletId, 
      amount, 
      currency, 
      frequency, // 'daily', 'weekly', 'monthly'
      startDate,
      note 
    } = req.body;
    
    // Validate required fields
    if (!recipientWalletId || !amount || !currency || !frequency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create recurring payment record
    const paymentId = 'rp_' + Date.now() + Math.random().toString(36).substring(2, 10);
    
    const recurringPayment = {
      id: paymentId,
      senderWalletId: auth.user.walletId,
      recipientWalletId,
      amount: parseFloat(amount),
      currency,
      frequency,
      startDate: startDate || new Date().toISOString(),
      nextPaymentDate: startDate || new Date().toISOString(),
      note: note || '',
      status: 'active',
      created: new Date().toISOString()
    };
    
    await db.collection('recurringPayments').insertOne(recurringPayment);
    
    return res.status(200).json({
      message: 'Recurring payment scheduled successfully',
      payment: recurringPayment
    });
  } catch (error) {
    console.error('Error creating recurring payment:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};