// test-db.js - Run this locally to test your MongoDB connection
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://emmanueldessallien:tuLQSdteavsz18ui@cluster0.rjhz3vb.mongodb.net/micromint?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    let client;
    
    try {
        console.log('Attempting to connect to MongoDB...');
        
        client = new MongoClient(MONGODB_URI, {
            connectTimeoutMS: 10000,
            serverSelectionTimeoutMS: 5000,
        });
        
        await client.connect();
        console.log('✅ Connected to MongoDB successfully!');
        
        // Test database access
        const db = client.db('micromint');
        await db.admin().ping();
        console.log('✅ Database ping successful!');
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log('📋 Available collections:', collections.map(c => c.name));
        
        // Test users collection
        const usersCollection = db.collection('users');
        const userCount = await usersCollection.countDocuments();
        console.log('👥 Users in database:', userCount);
        
        // Test wallets collection
        const walletsCollection = db.collection('wallets');
        const walletCount = await walletsCollection.countDocuments();
        console.log('💰 Wallets in database:', walletCount);
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔒 Connection closed.');
        }
    }
}

testConnection();