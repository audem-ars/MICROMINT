// api/exchange.js
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
    
    const { fromCurrency, toCurrency, amount } = req.body;
    
    // Validate params
    if (!fromCurrency || !toCurrency || !amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Invalid exchange parameters' });
    }
    
    const walletId = auth.user.walletId;
    
    // Check balance
    const balance = await db.collection('balances').findOne({
      walletId,
      currency: fromCurrency
    });
    
    if (!balance || balance.amount < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Get exchange rate (in real app, this would come from an exchange API)
    const rates = {
      'USD-EUR': 0.93,
      'EUR-USD': 1.07,
      'USD-MM': 10,
      'MM-USD': 0.1,
      'EUR-MM': 9.3,
      'MM-EUR': 0.11
    };
    
    const rateKey = `${fromCurrency}-${toCurrency}`;
    const rate = rates[rateKey];
    
    if (!rate) {
      return res.status(400).json({ error: 'Unsupported currency pair' });
    }
    
    // Calculate exchange amount
    const exchangeAmount = parseFloat(amount) * rate;
    
    // Update balances
    await db.collection('balances').updateOne(
      { walletId, currency: fromCurrency },
      { $inc: { amount: -parseFloat(amount) } }
    );
    
    await db.collection('balances').updateOne(
      { walletId, currency: toCurrency },
      { $inc: { amount: exchangeAmount } },
      { upsert: true }
    );
    
    // Create transaction record
    const txId = 'tx_' + Date.now() + Math.random().toString(36).substring(2, 10);
    
    await db.collection('transactions').insertOne({
      id: txId,
      type: 'exchange',
      walletId,
      fromCurrency,
      toCurrency,
      fromAmount: parseFloat(amount),
      toAmount: exchangeAmount,
      rate,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
    
    return res.status(200).json({
      success: true,
      fromAmount: parseFloat(amount),
      toAmount: exchangeAmount,
      rate,
      transaction: txId
    });
  } catch (error) {
    console.error('Exchange error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};