// api/groups/auth.js
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware 
const authenticateUser = async (req) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'No token provided' };
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    return { authenticated: true, user: decoded };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
};

// Main handler for auth routes
module.exports = async function handleAuth(req, res, path) {
  // Assume req.body is parsed middleware (common in frameworks like Express/Vercel)
  if (!req.body && req.method !== 'GET') {
     // Basic body parsing for non-GET requests if not already handled
     let body = '';
     req.on('data', chunk => { body += chunk.toString(); });
     await new Promise(resolve => req.on('end', resolve));
     try {
       req.body = JSON.parse(body || '{}');
     } catch (e) {
       return res.status(400).json({ error: 'Invalid JSON body' });
     }
  }

  // Signup endpoint
  if (path === '/auth/signup' && req.method === 'POST') {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Check if user exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.collection('users').insertOne({
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        created: new Date().toISOString()
      });

      const userId = result.insertedId.toString();

      // Create wallet
      const walletId = 'mm_' + Date.now() + Math.random().toString(36).substring(2, 10);
      await db.collection('wallets').insertOne({
        id: walletId,
        userId,
        name: 'Primary Wallet',
        created: new Date().toISOString(),
        publicKey: 'pk_' + Math.random().toString(36).substring(2, 30),
        privateKey: 'sk_' + Math.random().toString(36).substring(2, 30) // Note: Storing private keys like this is insecure in production
      });

      // Initialize balances
      await db.collection('balances').insertMany([
        { walletId, currency: 'USD', amount: 1000 },
        { walletId, currency: 'EUR', amount: 750 },
        { walletId, currency: 'MM', amount: 100 }
      ]);

      // Generate token
      const token = jwt.sign(
        { userId, email, walletId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        message: 'User created successfully',
        token,
        user: { id: userId, email, name: name || email.split('@')[0], walletId }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    } finally {
      await client.close();
    }
  }
  // Login endpoint
  else if (path === '/auth/login' && req.method === 'POST') {
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

      // Get wallet
      const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });

      // Generate token
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, walletId: wallet?.id },
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
          walletId: wallet?.id
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ error: 'Login failed' });
    } finally {
      await client.close();
    }
  }
  // Get user data endpoint
  else if (path === '/auth/user' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get user
      const user = await db.collection('users').findOne({
        _id: new ObjectId(auth.user.userId)
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        walletId: auth.user.walletId,
        created: user.created
      });
    } catch (error) {
      console.error('Error getting user data:', error);
      return res.status(500).json({ error: 'Failed to get user data' });
    } finally {
      await client.close();
    }
  }
  else {
    return res.status(404).json({ error: 'Auth endpoint not found' });
  }
};

// Export the middleware for use in other files
module.exports.authenticateUser = authenticateUser;