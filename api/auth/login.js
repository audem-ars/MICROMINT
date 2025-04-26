// api/auth/login.js
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get user's wallet
    const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email,
        walletId: wallet ? wallet.id : null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        walletId: wallet ? wallet.id : null
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Login failed' });
  } finally {
    await client.close();
  }
};