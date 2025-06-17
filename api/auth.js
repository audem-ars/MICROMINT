// api/auth.js (Complete with Password Reset)
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nacl = require('tweetnacl');
const { randomBytes } = require('crypto');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const INITIAL_BALANCES = { USD: 0, EUR: 0, MM: 10 };

// Email configuration
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};

// Validate environment variables
if (!MONGODB_URI) {
    console.error('[CRITICAL] MONGODB_URI environment variable is not set');
}

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
    let db;

    try {
        console.log(`[api/auth.js] ${req.method} ${req.url}`);
        console.log(`[api/auth.js] Body:`, req.body);
        console.log(`[api/auth.js] Query:`, req.query);

        // Validate environment
        if (!MONGODB_URI) {
            return res.status(500).json({ 
                error: 'Server configuration error', 
                details: 'Database connection not configured' 
            });
        }

        // --- Central DB Connection ---
        try {
            client = new MongoClient(MONGODB_URI);
            await client.connect();
            db = client.db(DB_NAME);
            console.log(`[api/auth.js] DB Connected successfully`);
        } catch (dbError) {
            console.error('[api/auth.js] Database connection failed:', dbError);
            return res.status(500).json({ 
                error: 'Database connection failed', 
                details: dbError.message 
            });
        }

        const action = req.query.action;
        console.log(`[api/auth.js] Action: ${action}`);

        let result;

        // --- Signup Handler ---
        if (req.method === 'POST' && action === 'signup') {
            console.log('[api/auth.js] Processing signup');
            const { name, email, password } = req.body;

            // Input Validation
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                throw { status: 400, body: { error: 'Name is required' } };
            }
            if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
                throw { status: 400, body: { error: 'Valid email is required' } };
            }
            if (!password || typeof password !== 'string' || password.length < 8) {
                throw { status: 400, body: { error: 'Password must be at least 8 characters long' } };
            }

            const usersCollection = db.collection('users');
            const walletsCollection = db.collection('wallets');

            const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                throw { status: 409, body: { error: 'Email address is already registered' } };
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUserDoc = { 
                name: name.trim(), 
                email: email.toLowerCase(), 
                password: hashedPassword, 
                createdAt: new Date() 
            };
            const userInsertResult = await usersCollection.insertOne(newUserDoc);
            const newUserId = userInsertResult.insertedId;

            const keyPair = generateKeyPair();
            const newWalletId = createWalletId();

            const newWalletDoc = {
                id: newWalletId,
                userId: newUserId.toString(),
                name: `${name.trim()}'s Wallet`,
                publicKey: keyPair.publicKey,
                balances: { ...INITIAL_BALANCES },
                created: new Date()
            };
            await walletsCollection.insertOne(newWalletDoc);

            const tokenPayload = { userId: newUserId.toString(), email: newUserDoc.email, walletId: newWalletId };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

            result = {
                status: 201,
                body: {
                    message: 'Signup successful',
                    token,
                    user: { id: newUserId.toString(), email: newUserDoc.email, name: newUserDoc.name, walletId: newWalletId },
                    privateKey: keyPair.privateKey
                }
            };

        // --- Login Handler ---
        } else if (req.method === 'POST' && action === 'login') {
            console.log('[api/auth.js] Processing login');
            const { email, password } = req.body;
            
            if (!email || !password) {
                throw { status: 400, body: { error: 'Email and password are required' } };
            }

            console.log(`[api/auth.js] Login attempt for: ${email}`);

            const user = await db.collection('users').findOne({ email: email.toLowerCase() });
            if (!user) {
                console.log('[api/auth.js] User not found');
                throw { status: 401, body: { error: 'Invalid credentials' } };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                console.log('[api/auth.js] Invalid password');
                throw { status: 401, body: { error: 'Invalid credentials' } };
            }

            const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });
            if (!wallet) {
                console.error(`[api/auth.js] Wallet not found for user ${user._id}`);
                throw { status: 500, body: { error: 'User data inconsistent: Wallet missing' } };
            }

            const tokenPayload = { userId: user._id.toString(), email: user.email, walletId: wallet.id };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

            console.log('[api/auth.js] Login successful');
            result = {
                status: 200,
                body: {
                    message: 'Login successful',
                    token,
                    user: { id: user._id.toString(), email: user.email, name: user.name, walletId: wallet.id }
                }
            };

        // --- Get User Handler ---
        } else if (req.method === 'GET' && action === 'user') {
            console.log('[api/auth.js] Processing get user');
            
            const authHeader = req.headers && req.headers.authorization;
            if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
                throw { status: 401, body: { error: 'Authorization header missing or invalid format' } };
            }
            
            const token = authHeader.split(' ')[1];
            if (!token) {
                throw { status: 401, body: { error: 'Token missing from authorization header' } };
            }

            let decodedToken;
            try {
                decodedToken = jwt.verify(token, JWT_SECRET);
            } catch (error) {
                console.log('[api/auth.js] Token verification failed:', error.message);
                throw { status: 401, body: { error: `Unauthorized: Invalid or expired token (${error.name})` } };
            }

            if (!decodedToken || !decodedToken.userId) {
                throw { status: 401, body: { error: 'Invalid token payload: User ID missing' } };
            }

            const userId = decodedToken.userId;
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user) {
                throw { status: 404, body: { error: 'User associated with this token not found' } };
            }

            const wallet = await db.collection('wallets').findOne({ userId: user._id.toString() });

            const userData = {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                walletId: wallet ? wallet.id : null
            };
            result = { status: 200, body: userData };

        // --- Forgot Password Handler ---
        } else if (req.method === 'POST' && action === 'forgot-password') {
            console.log('[api/auth.js] Processing forgot password');
            const { email } = req.body;
            
            if (!email) {
                throw { status: 400, body: { error: 'Email is required' } };
            }

            const user = await db.collection('users').findOne({ email: email.toLowerCase() });
            if (!user) {
                // Don't reveal if email exists or not for security
                result = {
                    status: 200,
                    body: { message: 'If an account with that email exists, we sent a reset link.' }
                };
            } else {
                // Generate reset token
                const resetToken = crypto.randomBytes(32).toString('hex');
                const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

                // Save reset token to user
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { 
                        $set: { 
                            resetToken: resetToken,
                            resetTokenExpiry: resetTokenExpiry
                        }
                    }
                );

                // Send email (if configured)
                try {
                    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                        const transporter = nodemailer.createTransport(EMAIL_CONFIG);
                        
                        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
                        
                        await transporter.sendMail({
                            from: process.env.SMTP_USER,
                            to: email,
                            subject: 'Password Reset - Micro Mint',
                            html: `
                                <h2>Password Reset Request</h2>
                                <p>You requested a password reset for your Micro Mint account.</p>
                                <p>Click the link below to reset your password:</p>
                                <a href="${resetUrl}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Reset Password</a>
                                <p>This link will expire in 1 hour.</p>
                                <p>If you didn't request this, please ignore this email.</p>
                            `
                        });
                        console.log('[api/auth.js] Password reset email sent');
                    } else {
                        console.log('[api/auth.js] Email not configured, reset token generated:', resetToken);
                    }
                } catch (emailError) {
                    console.error('[api/auth.js] Failed to send email:', emailError);
                    // Don't throw error, just log it
                }

                result = {
                    status: 200,
                    body: { message: 'If an account with that email exists, we sent a reset link.' }
                };
            }

        // --- Reset Password Handler ---
        } else if (req.method === 'POST' && action === 'reset-password') {
            console.log('[api/auth.js] Processing password reset');
            const { token, password } = req.body;
            
            if (!token || !password) {
                throw { status: 400, body: { error: 'Token and password are required' } };
            }

            if (password.length < 8) {
                throw { status: 400, body: { error: 'Password must be at least 8 characters long' } };
            }

            // Find user with valid reset token
            const user = await db.collection('users').findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: new Date() }
            });

            if (!user) {
                throw { status: 400, body: { error: 'Invalid or expired reset token' } };
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Update user password and clear reset token
            await db.collection('users').updateOne(
                { _id: user._id },
                { 
                    $set: { password: hashedPassword },
                    $unset: { resetToken: "", resetTokenExpiry: "" }
                }
            );

            console.log('[api/auth.js] Password reset successful');
            result = {
                status: 200,
                body: { message: 'Password reset successful' }
            };

        } else {
            console.log(`[api/auth.js] Invalid action or method: ${req.method} ${action}`);
            res.setHeader('Allow', ['GET', 'POST']);
            const status = action ? 405 : 400;
            const errorMessage = action ? `Method ${req.method} not allowed for action ${action}` : 'Missing or invalid action query parameter';
            return res.status(status).json({ error: errorMessage });
        }

        // --- Send Response ---
        console.log(`[api/auth.js] Sending response: ${result.status}`);
        return res.status(result.status).json(result.body);

    } catch (error) {
        console.error(`[api/auth.js] Error:`, {
            message: error.message,
            stack: error.stack,
            status: error.status,
            body: error.body
        });

        const status = error.status || 500;
        const body = error.body || { 
            error: 'Internal Server Error', 
            details: error.message 
        };
        return res.status(status).json(body);
        
    } finally {
        if (client) {
            try {
                await client.close();
                console.log(`[api/auth.js] DB Connection closed`);
            } catch (closeError) {
                console.error('[api/auth.js] Error closing DB connection:', closeError);
            }
        }
    }
};