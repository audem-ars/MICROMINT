// api/transactions/graph.js
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res) => {
    // --- 1. Check Method & Auth ---
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
         if (!decoded.userId) { // Assuming userId is in token, adjust if needed
            return res.status(401).json({ error: 'Invalid token payload' });
         }
    } catch (error) {
        return res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
    // const requestingUserId = decoded.userId; // Use if needed

    // --- 2. Get Query Params ---
    const { walletId, depth: queryDepth } = req.query;
    const depth = parseInt(queryDepth, 10) || 5; // Default depth 5 if not specified/invalid
    const maxNodes = 50; // Limit total nodes to prevent huge graphs

    if (!walletId) {
        return res.status(400).json({ error: 'Missing walletId query parameter' });
    }

    let client;
    try {
        // --- 3. Connect to DB ---
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        console.log(`Connected to DB to fetch graph data starting from wallet: ${walletId}, depth: ${depth}`);

        // --- 4. Graph Traversal Logic (BFS Example) ---
        const nodes = new Map(); // Use Map for efficient node lookup { id: nodeData }
        const edges = [];       // Array of { from: txId1, to: txId2 }
        const queue = [];       // Queue for BFS: [{ txId: string, currentDepth: number }]
        const visitedTxIds = new Set(); // Keep track of visited transactions

        // Find initial transactions involving the target wallet (adjust query as needed)
        const initialTxs = await db.collection('transactions').find({
            $or: [{ senderWalletId: walletId }, { recipientWalletId: walletId }]
        })
        .sort({ timestamp: -1 }) // Start with recent ones
        .limit(10) // Limit initial seed transactions
        .toArray();

        if (initialTxs.length === 0) {
            console.log(`No initial transactions found for wallet ${walletId}`);
             // Return empty graph if no transactions found
             return res.status(200).json({ nodes: [], edges: [] });
        }

        // Add initial transactions to queue and nodes list
        initialTxs.forEach(tx => {
             const txIdStr = tx._id.toString();
             if (!visitedTxIds.has(txIdStr) && nodes.size < maxNodes) {
                 queue.push({ txId: txIdStr, currentDepth: 0 });
                 visitedTxIds.add(txIdStr);
                 nodes.set(txIdStr, {
                     id: txIdStr, // vis-network needs 'id'
                     label: `${tx.amount} ${tx.currency}`, // Simple label
                     title: `ID: ${txIdStr}\nStatus: ${tx.status}\nTime: ${new Date(tx.timestamp).toLocaleTimeString()}`, // Tooltip
                     status: tx.status, // For grouping/coloring
                     timestamp: tx.timestamp // Store for potential use
                 });
             }
        });


        // Start BFS traversal
        let head = 0;
        while (head < queue.length && head < maxNodes) { // Limit BFS iterations
            const { txId: currentTxId, currentDepth } = queue[head++];

            if (currentDepth >= depth) continue; // Stop if max depth reached

            // Find transactions that reference the current one (adjust field name)
            // This depends HEAVILY on your DAG structure (e.g., 'previousTransactionIds', 'parents')
            const referencingTxs = await db.collection('transactions').find({
               // EXAMPLE: If transactions store IDs of transactions they reference/confirm
               previousTransactionIds: currentTxId
               // Adjust this query based on your actual data model!
            }).limit(5).toArray(); // Limit children fetched per node

            for (const nextTx of referencingTxs) {
                const nextTxIdStr = nextTx._id.toString();

                // Add edge from currentTx to nextTx
                 if (!visitedTxIds.has(nextTxIdStr) || edges.length < maxNodes * 2 ) { // Also limit edges
                   edges.push({ from: currentTxId, to: nextTxIdStr });
                }

                // Add nextTx node if not visited and within node limit
                if (!visitedTxIds.has(nextTxIdStr) && nodes.size < maxNodes) {
                    visitedTxIds.add(nextTxIdStr);
                    queue.push({ txId: nextTxIdStr, currentDepth: currentDepth + 1 });
                    nodes.set(nextTxIdStr, {
                        id: nextTxIdStr,
                        label: `${nextTx.amount} ${nextTx.currency}`,
                        title: `ID: ${nextTxIdStr}\nStatus: ${nextTx.status}\nTime: ${new Date(nextTx.timestamp).toLocaleTimeString()}`,
                        status: nextTx.status,
                        timestamp: nextTx.timestamp
                    });
                }
            }
            // You might also need to find transactions referenced *by* the current one (parents)
            // depending on how you want the graph to look.
        }

        console.log(`Graph generated: ${nodes.size} nodes, ${edges.length} edges`);

        // --- 5. Return Graph Data ---
        // Convert Map values to array for JSON response
        return res.status(200).json({ nodes: Array.from(nodes.values()), edges });

    } catch (error) {
        console.error(`Server error fetching graph data for ${walletId}:`, error);
        return res.status(500).json({ error: 'Internal server error fetching graph data' });
    } finally {
        if (client) {
            await client.close();
            console.log(`Closed DB connection for /api/transactions/graph`);
        }
    }
};