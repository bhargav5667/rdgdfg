const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your React app's URL
    methods: ["GET", "POST"]
  }
});

// Keep track of connected users
const users = {};

io.on('connection', (socket) => {
  // Assign a unique user ID
  const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  users[socket.id] = { id: userId };

  // Send user ID to client
  socket.emit('userId', userId);

  // Handle position updates
  socket.on('updatePosition', (data) => {
    // Broadcast to all other clients
    socket.broadcast.emit('position', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    delete users[socket.id];
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});