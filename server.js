// server.js - Express server serving both API and React app
require('dotenv').config(); // Load environment variables FIRST

const express = require('express');
const path = require('path');
const cors = require('cors');

// Import your auth handler
const authHandler = require('./api/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes BEFORE static files
app.all('/api/auth', authHandler);

// Serve React build files
app.use(express.static(path.join(__dirname, 'build')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/auth`);
});