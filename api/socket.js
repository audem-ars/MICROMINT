// api/socket.js
const { Server } = require('socket.io');
let io;

module.exports = (req, res) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io');
    
    io = new Server(res.socket.server);
    res.socket.server.io = io;
    
    io.on('connection', socket => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('join-wallet', walletId => {
        socket.join(walletId);
        console.log(`Socket ${socket.id} joined wallet ${walletId}`);
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  
  res.end();
};