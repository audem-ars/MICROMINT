// api/groups/wallets.js
const { MongoClient } = require('mongodb');
const { authenticateUser } = require('../middleware/auth');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res, path) => {
  // Get Wallet
  if (path === '/wallets/get' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const walletId = req.query.walletId || auth.user.walletId;
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Get wallet
      const wallet = await db.collection('wallets').findOne({ id: walletId });
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      // Get balances
      const balances = await db.collection('balances')
        .find({ walletId })
        .toArray();
      
      const formattedBalances = {};
      
      balances.forEach(balance => {
        formattedBalances[balance.currency] = balance.amount;
      });
      
      // Ensure standard currencies
      const standardCurrencies = ['USD', 'EUR', 'MM'];
      standardCurrencies.forEach(currency => {
        if (!formattedBalances[currency]) {
          formattedBalances[currency] = 0;
        }
      });
      
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
  }
  
  // Get Balance
  else if (path === '/wallets/balance' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const walletId = req.query.walletId || auth.user.walletId;
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Get balances
      const balances = await db.collection('balances')
        .find({ walletId })
        .toArray();
      
      const formattedBalances = {};
      
      balances.forEach(balance => {
        formattedBalances[balance.currency] = balance.amount;
      });
      
      // Ensure standard currencies
      const standardCurrencies = ['USD', 'EUR', 'MM'];
      standardCurrencies.forEach(currency => {
        if (!formattedBalances[currency]) {
          formattedBalances[currency] = 0;
        }
      });
      
      return res.status(200).json(formattedBalances);
    } catch (error) {
      console.error('Error getting balance:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Create Wallet
  else if (path === '/wallets/create' && req.method === 'POST') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const { name } = req.body;
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Generate wallet ID
      const walletId = 'mm_' + Date.now() + crypto.randomBytes(4).toString('hex');
      
     // Create wallet
     const wallet = {
        id: walletId,
        userId: auth.user.userId,
        name: name || 'Secondary Wallet',
        created: new Date().toISOString(),
        publicKey: 'pk_' + crypto.randomBytes(16).toString('hex'),
        privateKey: 'sk_' + crypto.randomBytes(16).toString('hex')
      };
      
      await db.collection('wallets').insertOne(wallet);
      
      // Initialize balances
      await db.collection('balances').insertMany([
        { walletId, currency: 'USD', amount: 0 },
        { walletId, currency: 'EUR', amount: 0 },
        { walletId, currency: 'MM', amount: 0 }
      ]);
      
      return res.status(200).json({
        message: 'Wallet created successfully',
        wallet: {
          id: wallet.id,
          name: wallet.name,
          created: wallet.created,
          publicKey: wallet.publicKey
        }
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Update Security Settings
  else if (path === '/wallets/security' && req.method === 'POST') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      const { 
        dailyLimit, 
        requireConfirmationAbove,
        twoFactorEnabled
      } = req.body;
      
      // Update security settings
      const updateData = {};
      
      if (dailyLimit !== undefined) {
        updateData['securitySettings.dailyLimit'] = parseFloat(dailyLimit);
      }
      
      if (requireConfirmationAbove !== undefined) {
        updateData['securitySettings.requireConfirmationAbove'] = parseFloat(requireConfirmationAbove);
      }
      
      if (twoFactorEnabled !== undefined) {
        updateData['securitySettings.twoFactorEnabled'] = twoFactorEnabled;
      }
      
      // Update wallet
      if (Object.keys(updateData).length > 0) {
        await db.collection('wallets').updateOne(
          { id: auth.user.walletId },
          { $set: updateData }
        );
      }
      
      return res.status(200).json({
        message: 'Security settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating security settings:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Get Notifications
  else if (path === '/wallets/notifications' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }
    
    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Get notifications for this wallet
      const notifications = await db.collection('notifications')
        .find({ walletId: auth.user.walletId })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
      
      // Mark as read
      if (req.query.markRead === 'true') {
        await db.collection('notifications').updateMany(
          { walletId: auth.user.walletId, read: false },
          { $set: { read: true } }
        );
      }
      
      return res.status(200).json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }
  
  // Fallback for unknown wallet endpoints
  else {
    return res.status(404).json({ error: 'Wallet endpoint not found' });
  }
};