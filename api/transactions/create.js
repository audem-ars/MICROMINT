// api/transactions/create.js
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// --- STEP 1: Import the verification function (Ensure path is correct) ---
const { verifySignature } = require('../utils/crypto');
// -----------------------------------------------------------------------

const { db: firebaseDb, initialized: firebaseInitialized } = require('../utils/firebaseAdmin'); // For Firebase push

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const NUMBER_OF_PARENTS = 2; // Target number of parents to link

module.exports = async (req, res) => {
    // --- 1. Check Method & Content Type (Your original code) ---
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
    }

    // --- 2. Authentication & Get User Info (Your original code) ---
    const authHeader = req.headers.authorization;
    let decoded;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid format (Bearer token required)' });
    }
    const token = authHeader.split(' ')[1];
    try {
        decoded = jwt.verify(token, JWT_SECRET);
        // Ensure token contains the necessary IDs from your login/signup logic
        if (!decoded.userId || !decoded.walletId) {
            console.error("Token missing userId or walletId:", decoded);
            return res.status(401).json({ error: 'Invalid token payload: Missing required user/wallet IDs' });
        }
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
    const senderUserId = decoded.userId; // Assuming this is MongoDB ObjectId string from User doc
    const senderWalletId = decoded.walletId; // This is the custom mm_... ID

    // --- 3. Get & Validate Transaction Data from Body (Your original code) ---
    const { amount: reqAmount, currency, recipientWalletId, note, timestamp, signature } = req.body;

    // Basic type and presence validation
    if (typeof reqAmount !== 'number' || reqAmount <= 0 || !currency || typeof currency !== 'string' || !recipientWalletId || typeof recipientWalletId !== 'string' || !timestamp || !signature || typeof signature !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid transaction fields. Required: amount (number>0), currency (string), recipientWalletId (string), timestamp (string/ISO date), signature (string)' });
    }
    if (senderWalletId === recipientWalletId) {
        return res.status(400).json({ error: 'Sender and recipient cannot be the same' });
    }
    const amount = parseFloat(reqAmount); // Ensure amount is a number
    const transactionTimestamp = new Date(timestamp); // Convert to Date object
    if (isNaN(transactionTimestamp.getTime())) {
        return res.status(400).json({ error: 'Invalid timestamp format. Please use ISO 8601 format.' });
    }

    let client; // MongoDB client

    try {
        // --- 4. Connect to DB (Your original code) ---
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const walletsCollection = db.collection('wallets');
        const transactionsCollection = db.collection('transactions');
        // Note: We assume balances are embedded in 'wallets' based on prior decision

        console.log(`Processing transaction: ${amount} ${currency} from ${senderWalletId} to ${recipientWalletId}`);

        // --- 5. Deeper Validation ---
        // a) Fetch Sender's Wallet & Public Key (using custom mm_... ID) (Your original code)
        const senderWallet = await walletsCollection.findOne({ id: senderWalletId });
        if (!senderWallet || !senderWallet.publicKey) {
            // Log userId too for debugging linkage issues
            console.error(`Sender wallet not found or missing public key for walletId: ${senderWalletId}, userId: ${senderUserId}`);
            return res.status(404).json({ error: 'Sender wallet not found or missing public key' });
        }
        const senderPublicKeyHex = senderWallet.publicKey; // Assuming stored as Hex

        // --- Start: Modified Signature Verification Block ---
        // b) Verify Signature (CRITICAL - NOW ENABLED)
        const messageToVerify = JSON.stringify({
             amount: amount, // Use the parsed number
             currency: currency,
             recipient: recipientWalletId,
             note: note || '', // Ensure note is handled consistently (empty string if null/undefined)
             timestamp: timestamp // Use the original timestamp string received
        });

        let isSignatureValid = false;
        try {
            // Call the imported verifySignature function
            isSignatureValid = verifySignature(messageToVerify, signature, senderPublicKeyHex);

        } catch (sigError) {
            // Handle errors *within* the verifySignature util (e.g., bad hex format)
            console.error("Error calling signature verification utility:", sigError);
            // Return 500 if the utility itself failed unexpectedly
            return res.status(500).json({ error: 'Signature verification check failed internally' });
        }

        // Check the result of the verification
        if (!isSignatureValid) {
            console.warn(`Invalid signature for transaction from ${senderWalletId}. \nMessage: ${messageToVerify}\nSig: ${signature}\nPK: ${senderPublicKeyHex}`);
            // Return 401 Unauthorized as the signature doesn't match
            return res.status(401).json({ error: 'Invalid transaction signature' });
        }
        // Signature is valid, proceed.
        console.log(`Signature verified successfully for transaction from ${senderWalletId}.`);
        // --- End: Modified Signature Verification Block ---


        // c) Check Recipient Wallet Exists (using custom mm_... ID) (Your original code)
        const recipientWallet = await walletsCollection.findOne({ id: recipientWalletId }, { projection: { _id: 1 } }); // Check existence efficiently
        if (!recipientWallet) {
            return res.status(404).json({ error: 'Recipient wallet not found' });
        }

        // d) Check Sender Balance (using embedded balances) (Your original code)
        const balancePath = `balances.${currency}`; // Path for dot notation update/query
        const currentSenderBalance = senderWallet.balances?.[currency] ?? 0; // Get current balance safely
        if (currentSenderBalance < amount) {
           return res.status(400).json({ error: `Insufficient ${currency} balance. Available: ${currentSenderBalance.toFixed(8)}` }); // Show more decimal places?
        }

        // --- 6. Select Parent IDs (Tip Selection - Aim for 2 Random Tips) (Your original code) ---
        let parentIds = []; // Stores ObjectIds
        try {
            const candidateParents = await transactionsCollection.find(
                {
                    status: 'pending',                  // Look for pending transactions
                    senderWalletId: { $ne: senderWalletId } // Not sent by the current sender
                    // Optional: Add other criteria like timestamp range, verification count < threshold, etc.
                },
                {
                    projection: { _id: 1 },             // Only fetch IDs
                    sort: { timestamp: -1 },          // Prioritize recent ones
                    limit: 20                           // Limit the pool size
                }
            ).toArray();

            if (candidateParents.length > 0) {
                // Shuffle the candidates randomly
                for (let i = candidateParents.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [candidateParents[i], candidateParents[j]] = [candidateParents[j], candidateParents[i]];
                }
                // Take the required number of unique parents
                parentIds = candidateParents.slice(0, NUMBER_OF_PARENTS).map(tx => tx._id); // Get ObjectIds
            }

            // Handle case where less than desired parents are found (incl. genesis)
            if (parentIds.length < NUMBER_OF_PARENTS) {
                 console.log(`Found only ${parentIds.length} suitable parents. Proceeding.`);
                 // If parentIds.length is 0, it's a genesis or orphan transaction
            }

            console.log(`Selected Parent IDs: ${parentIds.map(id => id.toString())}`);

        } catch (tipError) {
             console.error("Error during parent transaction selection:", tipError);
             // Decide if error is critical. For now, proceed without parents.
             parentIds = [];
        }

        // --- 7. Prepare New Transaction Document (Your original code) ---
        const newTransaction = {
            // _id will be auto-generated by MongoDB
            senderWalletId: senderWalletId,
            recipientWalletId: recipientWalletId,
            amount: amount,
            currency: currency,
            note: note || '',
            timestamp: transactionTimestamp, // Use the Date object
            signature: signature,
            status: 'pending', // Initial status
            parentIds: parentIds, // Array of ObjectIds
            verificationCount: 0,
            verifiedBy: [] // Array of User IDs or Wallet IDs who verified
            // Add other relevant fields if needed
        };

        // --- 8. Atomically Update Balances & Insert Transaction (Your original code) ---
        // ** PRODUCTION NOTE: Use MongoDB Transactions for guaranteed atomicity **
        // const session = client.startSession();
        let savedTxId; // To store the ID of the inserted transaction

        try {
            // await session.withTransaction(async () => { // If using transactions

                // a) Decrease sender balance (Atomically checks funds again)
                const senderUpdateResult = await walletsCollection.updateOne(
                    { id: senderWalletId, [balancePath]: { $gte: amount } }, // Query includes balance check
                    { $inc: { [balancePath]: -amount } }
                    // { session } // Pass session if using transactions
                );
                // If modifiedCount is 0, it means the balance was insufficient OR wallet wasn't found (less likely now)
                if (senderUpdateResult.modifiedCount === 0) {
                    // Re-fetch balance to give accurate error, maybe funds changed between initial check and update
                    const checkWallet = await walletsCollection.findOne({ id: senderWalletId });
                    const checkBalance = checkWallet?.balances?.[currency] ?? 0;
                    throw new Error(`Failed to update sender balance. Funds might be insufficient (Available: ${checkBalance}) or wallet ID mismatch.`);
                }

                // b) Increase recipient balance
                // Using $inc automatically handles if the currency field exists.
                await walletsCollection.updateOne(
                    { id: recipientWalletId },
                    { $inc: { [balancePath]: amount } }
                    // { session } // Pass session if using transactions
                );

                // c) Insert the new transaction document
                const insertResult = await transactionsCollection.insertOne(newTransaction /*, { session } */);
                if (!insertResult.insertedId) {
                    throw new Error("Failed to insert transaction document.");
                }
                savedTxId = insertResult.insertedId; // Get the ObjectId

                console.log(`Transaction ${savedTxId} created and balances updated.`);

            // }); // End session.withTransaction
        } catch (txError) {
             // if (session) await session.abortTransaction(); // Abort on error if using transactions
             console.error("Error during balance update / transaction insert:", txError);
             throw txError; // Re-throw to be caught by outer catch block
        } finally {
            // if (session) await session.endSession();
        }

        // --- 9. (Optional) Notify via Firebase (Your original code) ---
        if (firebaseInitialized && firebaseDb && savedTxId) {
            try {
                const txIdStr = savedTxId.toString();
                // Prepare data for Firebase (convert ObjectIds if necessary)
                const savedTxForFirebase = { ...newTransaction, _id: txIdStr }; // Use string ID
                savedTxForFirebase.parentIds = savedTxForFirebase.parentIds.map(id => id.toString());

                // Use Promise.allSettled for non-critical pushes (log errors but don't fail request)
                const pushes = await Promise.allSettled([
                    firebaseDb.ref(`transactions/${txIdStr}`).set(savedTxForFirebase),
                    firebaseDb.ref(`pendingVerifications/${txIdStr}`).set(savedTxForFirebase),
                    firebaseDb.ref(`userFeeds/${senderWalletId}/txUpdate`).push(txIdStr),
                    firebaseDb.ref(`userFeeds/${recipientWalletId}/txUpdate`).push(txIdStr)
                ]);

                pushes.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        console.error(`Firebase push failed (index ${index}):`, result.reason);
                    }
                });
                console.log(`Transaction ${savedTxId} push attempted to Firebase.`);

            } catch (firebaseError) {
                 console.error("General error pushing transaction to Firebase:", firebaseError);
                 // Don't fail the whole request just because Firebase push failed
            }
        } else {
             console.warn("Firebase Admin SDK not initialized or transaction not saved, skipping push to RTDB.");
        }

        // --- 10. Return Success (Your original code) ---
        const responseTransaction = { ...newTransaction, _id: savedTxId }; // Final object with _id
        return res.status(201).json({ message: 'Transaction created successfully', transaction: responseTransaction });

    } catch (error) {
        console.error("Error in /api/transactions/create:", error);
         // Avoid exposing detailed internal errors to the client in production
         // Use specific status codes and messages where appropriate (like the balance check)
        const clientErrorMessage = error.message.startsWith('Failed to update sender balance') || error.message.startsWith('Insufficient') ? error.message : 'Failed to create transaction';
        const statusCode = error.message.startsWith('Insufficient') ? 400 : (error.message === 'Invalid transaction signature' ? 401 : 500); // Adjust status code
        return res.status(statusCode).json({ error: clientErrorMessage });
    } finally {
        if (client) {
            await client.close();
            console.log("Closed DB connection for /api/transactions/create");
        }
    }
};