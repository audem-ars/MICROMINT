// api/groups/transactions.js
const { MongoClient } = require('mongodb');
const { authenticateUser } = require('../middleware/auth');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

// Helper function to format relative time
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

module.exports = async (req, res, path) => {
  // Create Transaction
  if (path === '/transactions/create' && req.method === 'POST') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      const data = req.body;
      
      // Validate
      if (!data.amount || !data.currency || !data.recipientWalletId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const senderWalletId = auth.user.walletId;
      
      // Check balance
      const balance = await db.collection('balances').findOne({
        walletId: senderWalletId,
        currency: data.currency
      });
      
      if (!balance || balance.amount < parseFloat(data.amount)) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      // Get tips to verify
      const tipsToVerify = await db.collection('tips')
        .find({})
        .limit(3)
        .toArray();
      
      // Generate transaction ID
      const txId = 'tx_' + Date.now() + crypto.randomBytes(4).toString('hex');
      
      // Create transaction
      const transaction = {
        id: txId,
        amount: parseFloat(data.amount),
        currency: data.currency,
        senderWalletId,
        recipientWalletId: data.recipientWalletId,
        note: data.note || '',
        timestamp: new Date().toISOString(),
        references: tipsToVerify.map(tip => tip.transactionId),
        signature: data.signature || 'sig_' + crypto.randomBytes(16).toString('hex'),
        status: 'pending'
      };
      
      await db.collection('transactions').insertOne(transaction);
      await db.collection('tips').insertOne({ transactionId: txId });
      
      // Verify referenced transactions
      for (const tip of tipsToVerify) {
        await db.collection('transactions').updateOne(
          { id: tip.transactionId },
          { 
            $set: {
              verifiedBy: senderWalletId,
              verifiedAt: new Date().toISOString(),
              status: 'completed'
            } 
          }
        );
        
        await db.collection('tips').deleteOne({ transactionId: tip.transactionId });
      }
      
      // Update balances
      await db.collection('balances').updateOne(
        { walletId: senderWalletId, currency: data.currency },
        { $inc: { amount: -parseFloat(data.amount) } }
      );
      
      await db.collection('balances').updateOne(
        { walletId: data.recipientWalletId, currency: data.currency },
        { $inc: { amount: parseFloat(data.amount) } },
        { upsert: true }
      );
      
      return res.status(200).json({
        message: 'Transaction created successfully',
        transaction,
        verifiedTransactions: tipsToVerify.length
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Verify Transaction
  else if (path === '/transactions/verify' && req.method === 'POST') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      const { transactionId } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ error: 'Missing transaction ID' });
      }
      
      // Check if transaction exists
      const transaction = await db.collection('transactions').findOne({ id: transactionId });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      if (transaction.verifiedBy) {
        return res.status(400).json({ error: 'Transaction already verified' });
      }
      
      // Mark as verified
      await db.collection('transactions').updateOne(
        { id: transactionId },
        { 
          $set: {
            verifiedBy: auth.user.walletId,
            verifiedAt: new Date().toISOString(),
            status: 'completed'
          } 
        }
      );
      
      await db.collection('tips').deleteOne({ transactionId });
      
      // Calculate reward
      const reward = parseFloat((transaction.amount * 0.001).toFixed(2));
      
      // Add reward
      await db.collection('balances').updateOne(
        { walletId: auth.user.walletId, currency: 'MM' },
        { $inc: { amount: reward } },
        { upsert: true }
      );
      
      // Create reward transaction
      const rewardTxId = 'tx_' + Date.now() + crypto.randomBytes(4).toString('hex');
      
      await db.collection('transactions').insertOne({
        id: rewardTxId,
        type: 'verify',
        amount: reward,
        currency: 'MM',
        senderWalletId: 'system',
        recipientWalletId: auth.user.walletId,
        description: 'Verification reward',
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      
      return res.status(200).json({
        message: 'Transaction verified successfully',
        reward,
        transactionId
      });
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Get Transaction History
  else if (path === '/transactions/history' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const walletId = req.query.walletId || auth.user.walletId;
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Get sent, received, and verification transactions
      const [sent, received, verifications] = await Promise.all([
        db.collection('transactions')
          .find({ senderWalletId: walletId })
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray(),
        
        db.collection('transactions')
          .find({ recipientWalletId: walletId })
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray(),
        
        db.collection('transactions')
          .find({ type: 'verify', recipientWalletId: walletId })
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray()
      ]);
      
      // Combine and format
      const allTransactions = [
        ...sent.map(tx => ({ ...tx, type: 'send' })),
        ...received.map(tx => ({ ...tx, type: 'receive' })),
        ...verifications.map(tx => ({ ...tx, type: 'verify' }))
      ];
      
      // Sort by timestamp
      allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return res.status(200).json(allTransactions);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Get Pending Verifications
  else if (path === '/transactions/pending-verifications' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const count = parseInt(req.query.count || '3');
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Get tips
      const tips = await db.collection('tips')
        .find({})
        .limit(count)
        .toArray();
      
      const pendingVerifications = [];
      
      for (const tip of tips) {
        const transaction = await db.collection('transactions')
          .findOne({ id: tip.transactionId });
        
        if (transaction) {
          const reward = parseFloat((transaction.amount * 0.001).toFixed(2));
          
          pendingVerifications.push({
            id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            sender: transaction.senderWalletId.substring(0, 10),
            recipient: transaction.recipientWalletId.substring(0, 10),
            date: formatRelativeTime(new Date(transaction.timestamp)),
            reward
          });
        }
      }
      
      return res.status(200).json(pendingVerifications);
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Get Transaction Graph
  else if (path === '/transactions/graph' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const depth = parseInt(req.query.depth || '10');
    const walletId = req.query.walletId || auth.user.walletId;
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Get transactions
      let query = {};
      if (walletId) {
        query = { 
          $or: [
            { senderWalletId: walletId },
            { recipientWalletId: walletId }
          ]
        };
      }
      
      const transactions = await db.collection('transactions')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(depth * 3)
        .toArray();
      
      // Build graph
      const nodes = [];
      const edges = [];
      const nodeMap = new Map();
      
      // Create nodes
      transactions.forEach(tx => {
        if (!nodeMap.has(tx.id)) {
          nodeMap.set(tx.id, {
            id: tx.id,
            label: `${tx.amount} ${tx.currency}`,
            type: 'transaction',
            status: tx.status,
            timestamp: tx.timestamp
          });
        }
      });
      
      // Create edges
      transactions.forEach(tx => {
        if (tx.references && tx.references.length > 0) {
          tx.references.forEach(refId => {
            if (nodeMap.has(refId)) {
              edges.push({
                from: tx.id,
                to: refId,
                arrows: 'to',
                type: 'reference'
              });
            }
          });
        }
      });
      
      const nodeArray = Array.from(nodeMap.values());
      
      return res.status(200).json({
        nodes: nodeArray.slice(0, depth),
        edges
      });
    } catch (error) {
      console.error('Error getting transaction graph:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Exchange currencies
  else if (path === '/transactions/exchange' && req.method === 'POST') {
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
      const txId = 'tx_' + Date.now() + crypto.randomBytes(4).toString('hex');
      
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
  }
  
  // Create Recurring Payment
  else if (path === '/transactions/recurring' && req.method === 'POST') {
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
      const paymentId = 'rp_' + Date.now() + crypto.randomBytes(4).toString('hex');
      
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
  }
  
  // Fallback for unknown transaction endpoints
  else {
    return res.status(404).json({ error: 'Transaction endpoint not found' });
  }
};