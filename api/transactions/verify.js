// api/transactions/verify.js
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Import any necessary utils (though maybe not needed for this specific logic)
// const { verifySignature } = require('../utils/crypto'); // Example if needed later
// const { ... } = require('../utils/helpers'); // Example if needed later

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// --- Configuration Constants ---
const VERIFICATION_THRESHOLD = 3; // How many verifications needed to confirm a transaction
const MM_REWARD_AMOUNT = 0.1; // Example: Reward amount in MM tokens per verification

module.exports = async (req, res) => {
    // --- 1. Check Method & Content Type ---
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
    }

    // --- 2. Authentication & Get Verifier Info ---
    const authHeader = req.headers.authorization;
    let decodedVerifier;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid format (Bearer token required)' });
    }
    const token = authHeader.split(' ')[1];
    try {
        decodedVerifier = jwt.verify(token, JWT_SECRET);
        // We need the user's wallet ID to credit the reward and prevent self-verification (maybe?)
        if (!decodedVerifier.userId || !decodedVerifier.walletId) {
            console.error("Verifier token missing userId or walletId:", decodedVerifier);
            return res.status(401).json({ error: 'Invalid token payload: Missing required user/wallet IDs for verifier' });
        }
    } catch (error) {
        console.error("Verifier token verification failed:", error.message);
        return res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
    const verifierUserId = decodedVerifier.userId; // MongoDB ObjectId string
    const verifierWalletId = decodedVerifier.walletId; // Custom mm_... ID

    // --- 3. Get & Validate Data from Body ---
    const { transactionId, verificationProof } = req.body; // verificationProof might contain data from the worker

    if (!transactionId || typeof transactionId !== 'string' || !ObjectId.isValid(transactionId)) {
        return res.status(400).json({ error: 'Missing or invalid transactionId field (must be a valid MongoDB ObjectId string)' });
    }
    // Optional: Validate verificationProof structure if it's expected
    // if (!verificationProof || typeof verificationProof !== 'object') {
    //     return res.status(400).json({ error: 'Missing or invalid verificationProof object' });
    // }

    console.log(`Verification attempt received for Tx ID: ${transactionId} by Verifier Wallet: ${verifierWalletId}`);

    let client;

    try {
        // --- 4. Connect to DB ---
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const transactionsCollection = db.collection('transactions');
        const walletsCollection = db.collection('wallets');

        // --- 5. Fetch the Transaction ---
        const txToVerifyObjectId = new ObjectId(transactionId);
        const transaction = await transactionsCollection.findOne({ _id: txToVerifyObjectId });

        if (!transaction) {
            return res.status(404).json({ error: `Transaction with ID ${transactionId} not found.` });
        }

        // --- 6. Validation Checks ---
        // a) Check if already completed
        if (transaction.status === 'completed' || transaction.status === 'verified') { // Use your completed status name
             console.log(`Transaction ${transactionId} is already completed. No action needed.`);
             // Decide response: 200 OK with message, or maybe 409 Conflict? 200 is friendlier.
             return res.status(200).json({ message: 'Transaction already completed.', transactionStatus: transaction.status });
        }
        // b) Check if verifier is the sender/recipient (optional rule?)
        // if (transaction.senderWalletId === verifierWalletId || transaction.recipientWalletId === verifierWalletId) {
        //    return res.status(403).json({ error: 'Cannot verify your own transactions.' });
        // }
        // c) Check if already verified by this user
        if (transaction.verifiedBy && transaction.verifiedBy.includes(verifierWalletId)) {
            console.log(`User ${verifierWalletId} already verified transaction ${transactionId}.`);
            return res.status(409).json({ message: 'You have already verified this transaction.' });
        }
        // d) Optional: Validate the 'verificationProof' from the worker here if necessary
        //    This depends heavily on what your worker actually calculates/returns.
        //    Example: const isValidProof = validateProof(transaction, verificationProof);
        //    if (!isValidProof) { return res.status(400).json({ error: 'Invalid verification proof.' }); }

        // --- 7. Update Transaction Document ---
        // Add verifier ID and increment count. Check if threshold is met.
        const currentVerificationCount = transaction.verificationCount || 0;
        const newVerificationCount = currentVerificationCount + 1;
        const newStatus = (newVerificationCount >= VERIFICATION_THRESHOLD)
                            ? 'completed' // Or 'verified' - use your final status name
                            : transaction.status; // Keep current status (e.g., 'pending')

        const transactionUpdateResult = await transactionsCollection.updateOne(
            { _id: txToVerifyObjectId },
            {
                $inc: { verificationCount: 1 },
                $addToSet: { verifiedBy: verifierWalletId }, // Use $addToSet to prevent duplicates
                $set: { status: newStatus } // Update status only if changed
            }
        );

        if (transactionUpdateResult.modifiedCount === 0 && transactionUpdateResult.matchedCount > 0) {
            // This might happen if the transaction was updated between findOne and updateOne
            // Or if $addToSet didn't add anything (user already in array - handled by check above)
            console.warn(`Transaction ${transactionId} matched but not modified by verifier ${verifierWalletId}. Status likely already updated or already verified by user.`);
            // Re-fetch to check status? Or just return success assuming prior checks handled it?
            // Let's assume prior checks are sufficient for now.
        } else if (transactionUpdateResult.matchedCount === 0) {
            // Should not happen if findOne succeeded, but good to check
            console.error(`Failed to find transaction ${transactionId} during update operation.`);
            throw new Error('Failed to update transaction during verification.');
        }

        console.log(`Transaction ${transactionId} updated. New count: ${newVerificationCount}, New status: ${newStatus}`);

        // --- 8. Credit Reward to Verifier (Atomically) ---
        const rewardBalancePath = `balances.MM`; // Path for MM balance
        const verifierWalletUpdateResult = await walletsCollection.updateOne(
            { id: verifierWalletId }, // Find verifier's wallet
            { $inc: { [rewardBalancePath]: MM_REWARD_AMOUNT } } // Increment MM balance
            // Consider $setOnInsert if MM field might not exist:
            // { $inc: { [rewardBalancePath]: MM_REWARD_AMOUNT }, $setOnInsert: { [rewardBalancePath]: 0 } }
        );

        if (verifierWalletUpdateResult.modifiedCount === 0 && verifierWalletUpdateResult.matchedCount === 0) {
             // Verifier wallet not found - serious issue if auth worked
             console.error(`CRITICAL: Verifier wallet ${verifierWalletId} not found during reward crediting!`);
             // Decide how to handle: Maybe log intensely, but don't fail the verification update?
             // Or try to revert the transaction update? Difficult without sessions.
             // For now, log and proceed, but this needs attention.
        } else {
            console.log(`Credited ${MM_REWARD_AMOUNT} MM reward to verifier ${verifierWalletId}.`);
        }

        // --- 9. (Optional) Update Firebase or other systems ---
        // Remove from pendingVerifications feed? Update transaction status?
        // Needs firebaseAdmin import: const { db: firebaseDb, initialized: firebaseInitialized } = require('../utils/firebaseAdmin');
        // if (firebaseInitialized && firebaseDb) {
        //    try {
        //       await firebaseDb.ref(`pendingVerifications/${transactionId}`).remove();
        //       if (newStatus === 'completed') {
        //          await firebaseDb.ref(`transactions/${transactionId}/status`).set('completed');
        //       }
        //       // Push update to user feeds?
        //    } catch(fbError) {
        //       console.error("Error updating Firebase after verification:", fbError);
        //    }
        // }

        // --- 10. Return Success ---
        return res.status(200).json({
            message: 'Verification processed successfully.',
            transactionId: transactionId,
            newStatus: newStatus,
            rewardCredited: MM_REWARD_AMOUNT // Confirm reward amount
        });

    } catch (error) {
        console.error("Error processing verification:", error);
        return res.status(500).json({ error: 'Failed to process verification', details: error.message });
    } finally {
        if (client) {
            await client.close();
            console.log("Closed DB connection for /api/transactions/verify");
        }
    }
};