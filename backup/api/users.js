// api/users.js
const { connectToDatabase } = require('./connectToDb');

export default async function handler(req, res) {
  // Set CORS headers if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const db = await connectToDatabase();
    
    // GET request to fetch users
    if (req.method === 'GET') {
      const users = await db.collection('users').find({}).toArray();
      res.status(200).json({ users });
      return;
    }
    
    // POST request to create a user
    if (req.method === 'POST') {
      const user = req.body;
      const result = await db.collection('users').insertOne(user);
      res.status(201).json({ result });
      return;
    }
    
    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}