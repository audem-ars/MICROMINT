// api/groups/wallets.js
const { MongoClient } = require('mongodb');
const { authenticateUser } = require('./auth');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

// Main handler for wallet routes
module.exports = async function handleWallets(req, res, path) {
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
};