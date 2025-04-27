// api/index.js
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Main request handler
module.exports = async (req, res) => {
  // Parse URL path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '');

  // Auth endpoints
  if (path.startsWith('/auth')) {
    return handleAuth(req, res, path);
  }
  // Transaction endpoints
  else if (path.startsWith('/transactions')) {
    return handleTransactions(req, res, path);
  }
  // Wallet endpoints
  else if (path.startsWith('/wallets')) {
    return handleWallets(req, res, path);
  }
  // Default response
  else {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
};

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

// Generate random string for signature (replaces crypto.randomBytes)
function generateRandomString(length = 16) {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// AUTH ENDPOINTS
async function handleAuth(req, res, path) {
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
}

// TRANSACTION ENDPOINTS
async function handleTransactions(req, res, path) {
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
    const url = new URL(req.url, `http://${req.headers.host}`); // Needed for query params

  // Create transaction endpoint
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
      const txId = generateRandomId('tx_', 8);

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
        signature: data.signature || 'sig_' + generateRandomString(32),
        status: 'pending' // Transaction starts as pending verification
      };

      await db.collection('transactions').insertOne(transaction);
      await db.collection('tips').insertOne({ transactionId: txId }); // Add this new transaction as a tip

      // Verify referenced transactions (this logic seems to complete them instantly, adjust if needed)
      for (const tip of tipsToVerify) {
          const referencedTx = await db.collection('transactions').findOne({ id: tip.transactionId });
          // Only verify if it's still pending and not the same as the current tx
          if (referencedTx && referencedTx.status === 'pending' && referencedTx.id !== txId) {
              await db.collection('transactions').updateOne(
                { id: tip.transactionId },
                {
                  $set: {
                    verifiedBy: senderWalletId, // Verified by the sender of the new transaction
                    verifiedAt: new Date().toISOString(),
                    status: 'completed'
                  }
                }
              );
              // Optionally remove the tip once verified
              await db.collection('tips').deleteOne({ transactionId: tip.transactionId });

              // Issue verification reward (MM) to the verifier (senderWalletId)
              const reward = parseFloat((referencedTx.amount * 0.001).toFixed(2)); // Example reward logic
              if (reward > 0) {
                  await db.collection('balances').updateOne(
                      { walletId: senderWalletId, currency: 'MM' },
                      { $inc: { amount: reward } },
                      { upsert: true }
                  );
                  // Log reward transaction
                  await db.collection('transactions').insertOne({
                      id: 'reward_' + tip.transactionId + '_' + Date.now(),
                      type: 'verify_reward',
                      amount: reward,
                      currency: 'MM',
                      recipientWalletId: senderWalletId,
                      description: `Reward for verifying ${tip.transactionId}`,
                      timestamp: new Date().toISOString(),
                      status: 'completed'
                  });
              }
          } else if (referencedTx && referencedTx.id === txId) {
              // A transaction shouldn't reference itself, potentially remove the tip if this occurs
              await db.collection('tips').deleteOne({ transactionId: tip.transactionId });
          } else {
              // Tip references a non-existent or already completed transaction, remove the tip
               await db.collection('tips').deleteOne({ transactionId: tip.transactionId });
          }
      }


      // Update balances (deduct from sender, add to recipient)
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
        verifiedTransactions: tipsToVerify.filter(tip => tip.transactionId !== txId).length // Count verified transactions excluding self-references
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }

  // Verify transaction endpoint (Manual verification separate from creation - might be redundant with above)
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

      // Check if transaction exists and is pending
      const transaction = await db.collection('transactions').findOne({ id: transactionId, status: 'pending' });

      if (!transaction) {
        const existingTx = await db.collection('transactions').findOne({ id: transactionId });
        if (existingTx) {
             return res.status(400).json({ error: 'Transaction already processed or not found' });
        }
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Ensure user is not verifying their own transaction
      if (transaction.senderWalletId === auth.user.walletId) {
           return res.status(403).json({ error: 'Cannot verify your own transaction' });
      }

      // Mark as verified
      const updateResult = await db.collection('transactions').updateOne(
        { id: transactionId, status: 'pending' }, // Ensure atomicity
        {
          $set: {
            verifiedBy: auth.user.walletId,
            verifiedAt: new Date().toISOString(),
            status: 'completed'
          }
        }
      );

      if (updateResult.matchedCount === 0) {
           return res.status(400).json({ error: 'Transaction was already verified or state changed' });
      }


      await db.collection('tips').deleteOne({ transactionId });

      // Calculate reward
      const reward = parseFloat((transaction.amount * 0.001).toFixed(2)); // Example reward

      // Add reward
      if (reward > 0) {
          await db.collection('balances').updateOne(
            { walletId: auth.user.walletId, currency: 'MM' },
            { $inc: { amount: reward } },
            { upsert: true }
          );

          // Create reward transaction
          const rewardTxId = 'reward_' + transactionId + '_' + Date.now();
          await db.collection('transactions').insertOne({
            id: rewardTxId,
            type: 'verify_reward',
            amount: reward,
            currency: 'MM',
            recipientWalletId: auth.user.walletId, // Reward goes to the verifier
            description: `Reward for verifying ${transactionId}`,
            timestamp: new Date().toISOString(),
            status: 'completed'
          });
       }

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

  // Get transaction history endpoint
  else if (path === '/transactions/history' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }

    const walletId = url.searchParams.get('walletId') || auth.user.walletId;

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get sent, received, and verification reward transactions
      const transactions = await db.collection('transactions')
          .find({
              $or: [
                  { senderWalletId: walletId },
                  { recipientWalletId: walletId }
              ]
           })
          .sort({ timestamp: -1 })
          .limit(100) // Limit results
          .toArray();

      // Format transactions to indicate type (send/receive/reward) relative to the requested walletId
      const formattedTransactions = transactions.map(tx => {
        let type = 'unknown';
        if (tx.type === 'verify_reward' && tx.recipientWalletId === walletId) {
            type = 'reward';
        } else if (tx.senderWalletId === walletId) {
            type = 'send';
        } else if (tx.recipientWalletId === walletId) {
            type = 'receive';
        }
        // Add relative time formatting
        const relativeTime = formatRelativeTime(new Date(tx.timestamp));
        return { ...tx, type, relativeTime };
      });


      return res.status(200).json(formattedTransactions);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }

  // Get pending verifications endpoint
  else if (path === '/transactions/pending-verifications' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }

    const count = parseInt(url.searchParams.get('count') || '3');
    const userWalletId = auth.user.walletId; // Get the user's wallet ID

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get tips referencing pending transactions, excluding those sent by the current user
      const tips = await db.collection('tips')
        .aggregate([
           {
               $lookup: {
                   from: "transactions",
                   localField: "transactionId",
                   foreignField: "id",
                   as: "transactionDetails"
               }
           },
           { $unwind: "$transactionDetails" },
           {
               $match: {
                   "transactionDetails.status": "pending",
                   "transactionDetails.senderWalletId": { $ne: userWalletId } // Exclude user's own transactions
               }
           },
           { $limit: count }
        ])
        .toArray();

      const pendingVerifications = tips.map(tip => {
          const transaction = tip.transactionDetails;
          const reward = parseFloat((transaction.amount * 0.001).toFixed(2)); // Example reward

          return {
            id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            sender: transaction.senderWalletId.substring(0, 10) + '...', // Shorten for display
            recipient: transaction.recipientWalletId.substring(0, 10) + '...', // Shorten for display
            date: formatRelativeTime(new Date(transaction.timestamp)),
            reward
          };
      });


      return res.status(200).json(pendingVerifications);
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }

  // Get transaction graph endpoint
  else if (path === '/transactions/graph' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }

    const depth = parseInt(url.searchParams.get('depth') || '10'); // How many transactions back approx
    const startTxId = url.searchParams.get('startTxId'); // Optional: start from a specific transaction

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        const nodes = [];
        const edges = [];
        const processedTxIds = new Set();
        const txQueue = [];

        // Start with recent transactions or a specific one
        if (startTxId) {
            const startTx = await db.collection('transactions').findOne({ id: startTxId });
            if (startTx) txQueue.push(startTx);
        } else {
            // Get some recent transactions as starting points
            const recentTxs = await db.collection('transactions')
                .find({})
                .sort({ timestamp: -1 })
                .limit(5) // Start with a few recent ones
                .toArray();
            txQueue.push(...recentTxs);
        }

        let iterations = 0;
        const maxIterations = depth * 5; // Limit processing to prevent infinite loops

        while (txQueue.length > 0 && nodes.length < depth && iterations < maxIterations) {
            const currentTx = txQueue.shift();
            iterations++;

            if (!currentTx || processedTxIds.has(currentTx.id)) {
                continue;
            }

            processedTxIds.add(currentTx.id);

            // Add node for the current transaction
            nodes.push({
                id: currentTx.id,
                label: `${currentTx.amount} ${currentTx.currency}\n${formatRelativeTime(new Date(currentTx.timestamp))}`,
                title: `ID: ${currentTx.id}\nStatus: ${currentTx.status}\nFrom: ${currentTx.senderWalletId}\nTo: ${currentTx.recipientWalletId}\nNote: ${currentTx.note || 'N/A'}`, // Tooltip info
                group: currentTx.status, // Group by status (pending, completed)
                type: 'transaction',
                status: currentTx.status,
                timestamp: currentTx.timestamp
            });

            // Process references (edges pointing FROM referenced transactions TO this one)
            if (currentTx.references && currentTx.references.length > 0) {
                for (const refId of currentTx.references) {
                    if (!processedTxIds.has(refId)) {
                        const referencedTx = await db.collection('transactions').findOne({ id: refId });
                        if (referencedTx) {
                             txQueue.push(referencedTx); // Add to queue for processing
                        }
                    }
                    // Add edge even if the referenced node isn't fully processed yet
                    edges.push({
                         from: refId, // Edge comes from the referenced transaction
                         to: currentTx.id, // Points to the current transaction
                         arrows: 'to',
                         type: 'reference',
                         title: 'References'
                     });
                }
            }
        }

        return res.status(200).json({
            nodes: nodes.slice(0, depth), // Ensure max node count
            edges
        });
    } catch (error) {
        console.error('Error getting transaction graph:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        await client.close();
    }
}


  // Default response for transaction endpoints
  else {
    return res.status(404).json({ error: 'Transaction endpoint not found' });
  }
}

// WALLET ENDPOINTS
async function handleWallets(req, res, path) {
   const url = new URL(req.url, `http://${req.headers.host}`); // Needed for query params

  // Get wallet endpoint (includes balances)
  if (path === '/wallets/get' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }

    const walletId = url.searchParams.get('walletId') || auth.user.walletId;

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get wallet details
      const wallet = await db.collection('wallets').findOne({ id: walletId });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

       // Ensure the user can only access their own wallet unless maybe an admin role exists
      if (wallet.userId !== auth.user.userId /* && !isAdmin(auth.user) */) {
          return res.status(403).json({ error: 'Forbidden: Cannot access this wallet' });
      }


      // Get balances
      const balances = await db.collection('balances')
        .find({ walletId })
        .toArray();

      const formattedBalances = {};

      balances.forEach(balance => {
        formattedBalances[balance.currency] = balance.amount;
      });

      // Ensure standard currencies exist even if balance is 0
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
        publicKey: wallet.publicKey, // Display public key
        // DO NOT return the private key here!
        balances: formattedBalances
      });
    } catch (error) {
      console.error('Error getting wallet:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }

  // Get balance endpoint (only balances)
  else if (path === '/wallets/balance' && req.method === 'GET') {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return res.status(401).json({ error: auth.error });
    }

    const walletId = url.searchParams.get('walletId') || auth.user.walletId;

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Check if wallet exists and belongs to the user
      const wallet = await db.collection('wallets').findOne({ id: walletId });
       if (!wallet) {
           return res.status(404).json({ error: 'Wallet not found' });
       }
       if (wallet.userId !== auth.user.userId /* && !isAdmin(auth.user) */) {
           return res.status(403).json({ error: 'Forbidden: Cannot access this wallet balance' });
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

      return res.status(200).json(formattedBalances);
    } catch (error) {
      console.error('Error getting balance:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      await client.close();
    }
  }

  // Default response for wallet endpoints
  else {
    return res.status(404).json({ error: 'Wallet endpoint not found' });
  }
}

function generateRandomId(prefix = '', length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}