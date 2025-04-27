// api/auth/signup.js
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken');
// --- Assuming your crypto utils can generate keys and a custom ID ---
// You NEED to implement these functions based on your chosen library (e.g., tweetnacl)
// const { generateKeyPair, createWalletId } = require('../utils/crypto'); // ADJUST PATH
const nacl = require('tweetnacl'); // Using tweetnacl as an example
const { randomBytes } = require('crypto'); // For random bytes if needed by ID generation

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const INITIAL_BALANCES = { // Define initial balances for new wallets
    USD: 0,
    EUR: 0,
    MM: 10 // Maybe give some initial MM as incentive? Or 0.
};

// --- Helper: Generate Custom Wallet ID (Example) ---
// Creates IDs like 'mm_<timestamp>_<random_part>'
function createWalletId() {
    const timestamp = Date.now();
    const randomPart = randomBytes(4).toString('hex'); // 8 hex characters
    return `mm_${timestamp}${randomPart}`;
}

// --- Helper: Generate Ed25519 Key Pair (Example using tweetnacl) ---
function generateKeyPair() {
    const keyPair = nacl.sign.keyPair();
    // Convert Uint8Array keys to a usable format (e.g., base64 or hex)
    // Using hex for simpler storage/retrieval, adjust if needed
    const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');
    const privateKeyHex = Buffer.from(keyPair.secretKey).toString('hex'); // secretKey contains private+public
    return { publicKey: publicKeyHex, privateKey: privateKeyHex };
}


module.exports = async (req, res) => {
    // --- 1. Check Method & Content Type ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
     if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
    }

    // --- 2. Get Input Data ---
    const { name, email, password } = req.body;

    // --- 3. Validate Input ---
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) { // Basic email format check
        return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) { // Example: Enforce minimum password length
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    let client;
    try {
        // --- 4. Connect to DB ---
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        const walletsCollection = db.collection('wallets');
        const balancesCollection = db.collection('balances');

        console.log(`Signup attempt for email: ${email}`);

        // --- 5. Check if User Already Exists ---
        const existingUser = await usersCollection.findOne({ email: email.toLowerCase() }); // Case-insensitive check
        if (existingUser) {
            console.warn(`Signup failed: Email already exists - ${email}`);
            return res.status(409).json({ error: 'Email address is already registered' }); // 409 Conflict
        }

        // --- 6. Hash Password ---
        const salt = await bcrypt.genSalt(10); // Generate salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash password

        // --- 7. Create New User Document ---
        const newUser = {
            // _id will be auto-generated ObjectId
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword, // Store the hashed password
            createdAt: new Date()
        };
        const userInsertResult = await usersCollection.insertOne(newUser);
        const newUserId = userInsertResult.insertedId; // Get the ObjectId of the new user
        console.log(`User created with ID: ${newUserId}`);

        // --- 8. Generate Wallet Keys and ID ---
        const keyPair = generateKeyPair(); // Implement this using your crypto library
        const newWalletId = createWalletId(); // Implement this helper

        // --- 9. Create New Wallet Document ---
        const newWallet = {
            // _id will be auto-generated ObjectId
            id: newWalletId, // Store the custom mm_... ID
            userId: newUserId.toString(), // Link to the user's ObjectId (as string)
            name: `${name.trim()}'s Wallet`, // Default wallet name
            publicKey: keyPair.publicKey, // Store public key (hex or base64)
            // DO NOT store raw private key directly here if possible.
            // It's better to encrypt it or let the user manage it client-side.
            // Storing it here for simplicity of this example, BUT THIS IS A SECURITY RISK.
            privateKey: keyPair.privateKey, // STORE SECURELY OR NOT AT ALL ON SERVER
            created: new Date()
            // balances: INITIAL_BALANCES // Alternative: Embed balances here instead of separate collection
        };
        await walletsCollection.insertOne(newWallet);
        console.log(`Wallet created with ID: ${newWalletId} for user ${newUserId}`);

        // --- 10. Create Initial Balance Documents ---
        const balanceDocs = Object.entries(INITIAL_BALANCES).map(([currency, amount]) => ({
            walletId: newWalletId, // Link to the custom wallet ID
            currency: currency,
            amount: amount,
            lastUpdated: new Date()
        }));
        if (balanceDocs.length > 0) {
            await balancesCollection.insertMany(balanceDocs);
            console.log(`Initial balances created for wallet ${newWalletId}`);
        }

        // --- 11. Generate JWT Token ---
        const tokenPayload = {
            userId: newUserId.toString(), // Use string representation of ObjectId
            email: newUser.email,
            walletId: newWalletId // Include the custom wallet ID
        };
        const token = jwt.sign(
            tokenPayload,
            JWT_SECRET,
            { expiresIn: '7d' } // Token expiration time
        );

        // --- 12. Return Success Response ---
        return res.status(201).json({ // 201 Created
            message: 'Signup successful',
            token,
            user: { // Send back some user info (excluding password!)
                id: newUserId.toString(),
                email: newUser.email,
                name: newUser.name,
                walletId: newWalletId
            }
        });

    } catch (error) {
        console.error("Error during signup:", error);
        // TODO: Implement cleanup if user was created but wallet/balances failed? (More complex)
        return res.status(500).json({ error: 'Signup failed due to server error', details: error.message });
    } finally {
        if (client) {
            await client.close();
            console.log("Closed DB connection for /api/auth/signup");
        }
    }
};