// api/connectToDb.js
const { MongoClient } = require('mongodb');

// MongoDB connection string should be in .env.local file
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  // Connect to the MongoDB cluster
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB);
  cachedDb = db;
  
  return db;
}

module.exports = { connectToDatabase };