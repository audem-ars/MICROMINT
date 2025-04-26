// api/getTransactionGraph.js
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get depth parameter (optional, default: 10)
  const depth = parseInt(req.query.depth || '10');
  const walletId = req.query.walletId; // Optional filter by wallet
  
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
      .limit(depth * 3) // Get more than needed to ensure connectivity
      .toArray();
    
    // Build graph data
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    
    // Create nodes for each transaction
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
    
    // Create edges from references
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
    
    // Convert nodes map to array
    const nodeArray = Array.from(nodeMap.values());
    
    // Trim to requested depth if needed
    const graph = {
      nodes: nodeArray.slice(0, depth),
      edges
    };
    
    return res.status(200).json(graph);
  } catch (error) {
    console.error('Error getting transaction graph:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};