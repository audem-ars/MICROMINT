// api/index.js
const authHandler = require('./groups/auth');
const transactionsHandler = require('./groups/transactions');
const walletsHandler = require('./groups/wallets');

module.exports = async (req, res) => {
  // Parse URL path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '');
  
  // Route to the appropriate handler
  if (path.startsWith('/auth')) {
    return authHandler(req, res, path);
  } else if (path.startsWith('/transactions')) {
    return transactionsHandler(req, res, path);
  } else if (path.startsWith('/wallets')) {
    return walletsHandler(req, res, path);
  } else {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
};