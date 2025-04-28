// api/auth.js
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nacl = require('tweetnacl');
const { randomBytes } = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const INITIAL_BALANCES = { USD: 0, EUR: 0, MM: 10 }; // Define once

// --- Wallet ID Generation Helper ---
function createWalletId() {
    const timestamp = Date.now();
    const randomPart = randomBytes(4).toString('hex');
    return `mm_${timestamp}${randomPart}`;
}

// --- Key Pair Generation Helper ---
function generateKeyPair() {
    const keyPair = nacl.sign.keyPair();
    const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');
    const privateKeyHex = Buffer.from(keyPair.secretKey).toString('hex');
    return { publicKey: publicKeyHex, privateKey: privateKeyHex };
}


// === Main Request Handler ===
module.exports = async (req, res) => {
    let client;
    let db; // Make db accessible in handlers

    try {
        // --- Central DB Connection ---
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`[api/auth.js] DB Connected for request: ${req.method} ${req.url}`);

        // --- Routing Logic ---
        const urlParts = req.url.split('?')[0].split('/').filter(part => part); // e.g., ['api', 'auth', 'login'] -> ['login'] relative to /api/auth
        const action = urlParts[0] || 'default'; // Get 'login', 'signup', 'user' or default

        let result;

        // --- Signup Handler ---
        if (req.method === 'POST' && action === 'signup') {
            console.log('[api/auth.js] Routing to Signup');
            const { name, email, password } = req.body;

            // Input Validation
            if (!name || typeof name !== 'string' || name.trim().length === 0) throw { status: 400, body: { error: 'Name is required' } };
            if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) throw { status: 400, body: { error: 'Valid email is required' } };
            if (!password || typeof password !== 'string' || password.length < 8) throw { status: 400, body: { error: 'Password must be at least 8 characters long' } };

            const usersCollection = db.collection('users');
            const walletsCollection = db.collection('wallets');
            // Balances collection reference (NOTE: Balances should likely be embedded now based on create.js)
            // const balancesCollection = db.collection('balances');

            const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
            if (existingUser) throw { status: 409, body: { error: 'Email address is already registered' } };

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUserDoc = { name: name.trim(), email: email.toLowerCase(), password: hashedPassword, createdAt: new Date() };
            const userInsertResult = await usersCollection.insertOne(newUserDoc);
            const newUserId = userInsertResult.insertedId;

            const keyPair = generateKeyPair();
            const newWalletId = createWalletId();

            const newWalletDoc = {
                id: newWalletId,
                userId: newUserId.toString(),
                name: `${name.trim()}'s Wallet`,
                publicKey: keyPair.publicKey,
                // --- EMBED BALANCES DIRECTLY ---
                balances: { ...INITIAL_BALANCES }, // Start with initial balances
                // privateKey: keyPair.privateKey, // --- SECURITY RISK: AVOID STORING RAW PRIVATE KEY ON SERVER ---
                // Instead, return private key ONLY in signup response for client to handle securely
                created: new Date()
            };
            await walletsCollection.insertOne(newWalletDoc);

            // --- REMOVE separate balances collection logic ---
            // const balanceDocs = Object.entries(INITIAL_BALANCES).map(([currency, amount]) => ({ /* ... */ }));
            // await balancesCollection.insertMany(balanceDocs);

            const tokenPayload = { userId: newUserId.toString(), email: newUserDoc.email, walletId: newWalletId };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

            result = {
                status: 201,
                body: {
                    message: 'Signup successful',
                    token,
                    user: { id: newUserId.toString(), email: newUserDoc.email, name: newUserDoc.name, walletId: newWalletId },
                    // --- IMPORTANT: Return private key ONLY here, securely ---
                    // --- The client MUST handle this immediately and store it safely (NOT localStorage for production) ---
                    privateKey: keyPair.privateKey // Send private key in response body
                }
            };

        // --- Login Handler ---
        } else if (req.method === 'POST' && action === 'login') {
            console.log('[api/auth.js] Routing to Login');
            const { email, password } = req.body;
            if (!email || !password) throw { status: 400, body: { error: 'Email and password are required' } };

            const user = await db.collection('users').findOne({ email });
            if (!user) throw { status: 401, body: { error: 'Invalid credentials' } };

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) throw { status: 401, body: { error: 'Invalid credentials' } };

            const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });
            if (!wallet) { // Should ideally not happen if signup creates wallet
                 console.error(`Login Error: Wallet not found for user ${user._id}`);
                 throw new Error('User data inconsistent: Wallet missing'); // Throw 500
            }

            const tokenPayload = { userId: user._id.toString(), email: user.email, walletId: wallet.id };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

            result = {
                status: 200,
                body: {
                    message: 'Login successful',
                    token,
                    user: { id: user._id.toString(), email: user.email, name: user.name, walletId: wallet.id }
                     // DO NOT RETURN PRIVATE KEY ON LOGIN
                }
            };

        // --- Get User Handler ---
        } else if (req.method === 'GET' && action === 'user') {
            console.log('[api/auth.js] Routing to Get User');
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) throw { status: 401, body: { error: 'Authorization header missing or invalid format' } };
            const token = authHeader.split(' ')[1];

            let decodedToken;
             try {
                 decodedToken = jwt.verify(token, JWT_SECRET);
             } catch (error) {
                  throw { status: 401, body: { error: `Unauthorized: Invalid or expired token (${error.name})` } };
             }

            if (!decodedToken || !decodedToken.userId) throw { status: 401, body: { error: 'Invalid token payload: User ID missing' } };
            const userId = decodedToken.userId;

             // Fetch user
             const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
             if (!user) throw { status: 404, body: { error: 'User associated with this token not found' } };

             // Fetch wallet
             const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });
             // Wallet might potentially be null if signup failed mid-way, handle gracefully

             const userData = {
                 id: user._id.toString(),
                 email: user.email,
                 name: user.name,
                 walletId: wallet ? wallet.id : null
             };
             result = { status: 200, body: userData };

        } else {
            // Handle unknown actions for /api/auth
            console.log(`[api/auth.js] Route not matched: ${req.method} ${req.url}`);
            res.setHeader('Allow', ['GET', 'POST']); // Adjust allowed methods
            return res.status(404).json({ error: 'Auth action not found' });
        }

        // --- Send Response from Handler Result ---
        return res.status(result.status).json(result.body);

    } catch (error) {
        // Catch errors thrown from handlers or DB connection
        console.error(`[api/auth.js] Unhandled Error: ${req.method} ${req.url}`, error);
        // If error has status/body (thrown by us), use that, otherwise default to 500
        const status = error.status || 500;
        const body = error.body || { error: 'Internal Server Error', details: error.message };
        return res.status(status).json(body);
    } finally {
        if (client) {
            await client.close();
            console.log(`[api/auth.js] DB Connection Closed for request: ${req.method} ${req.url}`);
        }
    }
};