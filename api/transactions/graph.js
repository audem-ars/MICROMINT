// api/transactions/graph.js
const { MongoClient, ObjectId } = require('mongodb'); // Ensure ObjectId is imported
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res) => {
    // --- 1. Check Method & Auth ---
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid format' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
         // You might use decoded.userId or decoded.walletId for auth checks if needed
         if (!decoded.userId) {
            return res.status(401).json({ error: 'Invalid token payload' });
         }
    } catch (error) {
        return res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }

    // --- 2. Get Query Params ---
    // Note: Frontend currently sends walletId=${user.id} which is MongoDB ObjectId string
    // Let's adjust to expect the custom mm_... walletId for consistency or handle both
    const { walletId: queryWalletId, depth: queryDepth, startTxId } = req.query; // startTxId not used in this simple BFS yet
    const depth = parseInt(queryDepth, 10) || 5; // Default depth 5
    const maxNodes = 75; // Limit total nodes for performance/visualization clarity

    // We need to decide which wallet ID to start from. Usually the custom ID makes more sense.
    // Let's assume queryWalletId IS the custom mm_... ID based on your frontend call.
    // If frontend sends user.id (ObjectId string), we'd need to fetch the wallet first to get the custom ID.
    const startWalletId = queryWalletId; // Assuming mm_... ID is passed

    if (!startWalletId) {
        return res.status(400).json({ error: 'Missing walletId query parameter (expecting mm_...)' });
    }

    let client;
    try {
        // --- 3. Connect to DB ---
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const transactionsCollection = db.collection('transactions');
        console.log(`Fetching graph data starting near wallet: ${startWalletId}, depth: ${depth}`);

        // --- 4. Graph Traversal Logic (BFS Backwards via parentIds) ---
        const nodes = new Map(); // { txMongoDbIdString: { id: txMongoDbIdString, label: ..., status: ... } }
        const edges = [];       // { from: childTxIdString, to: parentTxIdString }
        const queue = [];       // Queue for BFS: [{ txObjectId: ObjectId, currentDepth: number }]
        const visitedTxIds = new Set(); // Store string IDs of visited nodes to prevent cycles/redundancy

        // Find initial transactions involving the target wallet to seed the search
        const initialTxs = await transactionsCollection.find({
            $or: [{ senderWalletId: startWalletId }, { recipientWalletId: startWalletId }]
        })
        .sort({ timestamp: -1 }) // Start with the most recent ones
        .limit(10) // Limit initial seeds
        .toArray();

        if (initialTxs.length === 0) {
            console.log(`No initial transactions found for wallet ${startWalletId}`);
            return res.status(200).json({ nodes: [], edges: [] }); // Return empty graph
        }

        // Seed the queue and nodes map with initial transactions
        initialTxs.forEach(tx => {
            const txIdStr = tx._id.toString();
            if (!visitedTxIds.has(txIdStr) && nodes.size < maxNodes) {
                queue.push({ txObjectId: tx._id, currentDepth: 0 }); // Use ObjectId for querying parents
                visitedTxIds.add(txIdStr);
                nodes.set(txIdStr, { // Add node data for vis-network
                    id: txIdStr, // vis-network needs 'id' as string
                    label: `${tx.amount?.toFixed(2)} ${tx.currency}`, // Basic label
                    title: `ID: ${txIdStr}\nStatus: ${tx.status}\nTime: ${tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}`, // Tooltip
                    status: tx.status, // For grouping/coloring
                });
            }
        });

        // Start BFS traversal (backwards following parentIds)
        let head = 0;
        while (head < queue.length && nodes.size < maxNodes) {
            const { txObjectId: currentTxObjectId, currentDepth } = queue[head++];

            if (currentDepth >= depth) continue; // Stop traversal at max depth

            // Fetch the current transaction to get its parentIds
            // Optimization: Could potentially project only the parentIds field
            const currentTx = await transactionsCollection.findOne({ _id: currentTxObjectId }, { projection: { parentIds: 1, _id: 1, amount: 1, currency: 1, status: 1, timestamp: 1 } }); // Fetch necessary fields

            // Check if currentTx exists and has parentIds
            if (!currentTx || !currentTx.parentIds || currentTx.parentIds.length === 0) {
                continue; // This node is a tip (or genesis) in this traversal direction
            }

            const currentTxIdStr = currentTx._id.toString();

            // Fetch the parent transactions based on the ObjectIds in parentIds array
            // Ensure parentIds contains valid ObjectIds
            const parentObjectIds = currentTx.parentIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

            if (parentObjectIds.length === 0) continue;

            const parentTxs = await transactionsCollection.find({
                _id: { $in: parentObjectIds }
            })
            // Limit how many parents we add in one go to control graph size
            .limit(maxNodes - nodes.size)
            .toArray();

            // Process parents
            for (const parentTx of parentTxs) {
                const parentTxIdStr = parentTx._id.toString();

                // Add edge from this transaction (child) *TO* its parent
                // vis.js uses 'from -> to', so edge goes from child ID to parent ID
                edges.push({ from: currentTxIdStr, to: parentTxIdStr });

                // Add parent node if not visited and within node limit
                if (!visitedTxIds.has(parentTxIdStr) && nodes.size < maxNodes) {
                    visitedTxIds.add(parentTxIdStr);
                    queue.push({ txObjectId: parentTx._id, currentDepth: currentDepth + 1 }); // Add parent ObjectId to queue
                    nodes.set(parentTxIdStr, { // Add node data for vis-network
                        id: parentTxIdStr,
                        label: `${parentTx.amount?.toFixed(2)} ${parentTx.currency}`,
                        title: `ID: ${parentTxIdStr}\nStatus: ${parentTx.status}\nTime: ${parentTx.timestamp ? new Date(parentTx.timestamp).toLocaleString() : 'N/A'}`,
                        status: parentTx.status,
                    });
                }
            }
        }

        console.log(`Graph generated: ${nodes.size} nodes, ${edges.length} edges`);

        // --- 5. Return Graph Data ---
        // Convert Map values to array for JSON response
        return res.status(200).json({ nodes: Array.from(nodes.values()), edges });

    } catch (error) {
        console.error(`Server error fetching graph data for ${startWalletId}:`, error);
        return res.status(500).json({ error: 'Internal server error fetching graph data', details: error.message });
    } finally {
        if (client) {
            await client.close();
            console.log(`Closed DB connection for /api/transactions/graph`);
        }
    }
};