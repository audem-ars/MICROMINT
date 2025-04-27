// api/utils/firebaseAdmin.js
const admin = require('firebase-admin');

let db; // Realtime Database reference
let initialized = false;

// Check if already initialized
if (!admin.apps.length) {
    try {
        // --- Get Service Account Key from Environment Variable ---
        // Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel Env Vars with the JSON content
        const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        // --- Get Database URL from Environment Variable ---
        // Set FIREBASE_DATABASE_URL in Vercel Env Vars
        const databaseURL = process.env.FIREBASE_DATABASE_URL;

        if (!serviceAccountJsonString) {
             throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set or empty.');
        }
         if (!databaseURL) {
             throw new Error('FIREBASE_DATABASE_URL environment variable not set or empty.');
        }

        const serviceAccount = JSON.parse(serviceAccountJsonString);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: databaseURL // Use the URL from env var
        });

        db = admin.database(); // Get Realtime Database instance
        initialized = true;
        console.log("Firebase Admin SDK Initialized Successfully.");

    } catch (error) {
         console.error("Firebase Admin SDK Initialization Error:", error.message);
         // Depending on severity, you might want to prevent functions from running
         // Or handle errors gracefully in the functions that import this module
         // For now, we'll let functions check the 'initialized' flag or handle db being undefined
    }

} else {
    // Already initialized (e.g., due to Vercel reusing execution environments)
    db = admin.database(); // Get instance from default app
    initialized = true;
    // console.log("Firebase Admin SDK already initialized."); // Less verbose log
}

// Export the database reference and an initialized flag
module.exports = { admin, db, initialized };