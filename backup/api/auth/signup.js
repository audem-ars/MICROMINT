// api/auth/signup.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      created: new Date().toISOString(),
      role: 'user'
    };
    
    const result = await db.collection('users').insertOne(user);
    const userId = result.insertedId.toString();
    
    // Create wallet for user
    const walletId = 'mm_' + Date.now() + Math.random().toString(36).substring(2, 10);
    const wallet = {
      id: walletId,
      userId,
      name: 'Primary Wallet',
      created: new Date().toISOString(),
      publicKey: 'pk_' + Math.random().toString(36).substring(2, 30),
      privateKey: 'sk_' + Math.random().toString(36).substring(2, 30)
    };
    
    await db.collection('wallets').insertOne(wallet);
    
    // Initialize balances
    const initialBalances = [
      { walletId, currency: 'USD', amount: 100 },  // Starting with smaller amounts
      { walletId, currency: 'EUR', amount: 75 },
      { walletId, currency: 'MM', amount: 10 }
    ];
    
    await db.collection('balances').insertMany(initialBalances);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, email, walletId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        email,
        name: user.name,
        walletId
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  } finally {
    await client.close();
  }
};