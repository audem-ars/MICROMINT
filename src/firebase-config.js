// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // For Realtime Database

// --- Use Environment Variables (Essential for Security!) ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // Optional

  // --- Add your actual databaseURL here, retrieved from Firebase Console ---
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://micromint-83690-default-rtdb.asia-southeast1.firebasedatabase.app"
  // Example: "https://your-project-id-default-rtdb.firebaseio.com"
};

// Initialize Firebase
let app;
let database;

try {
    // Basic check if required keys are present
    if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
        console.error("Firebase config keys (apiKey, databaseURL) are missing. Ensure environment variables are set.");
        // Optionally throw an error or handle this state appropriately
    } else {
        app = initializeApp(firebaseConfig);
        database = getDatabase(app);
        console.log("Firebase Client SDK Initialized.");
    }
} catch (error) {
    console.error("Error initializing Firebase Client SDK:", error);
    // Handle initialization error (e.g., show an error message to the user)
}


// Export the database instance (it might be undefined if initialization failed)
export { database };

// --- Environment Variable Reminder ---
// Remember to:
// 1. Create `.env.local` in your project root (add to .gitignore).
// 2. Define REACT_APP_FIREBASE_... variables there with your keys.
// 3. Define the same REACT_APP_FIREBASE_... variables in Vercel Environment Variables.