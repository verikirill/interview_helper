const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Allow CORS for the Electron app (or any client during development)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve frontend web page
app.use(express.static(path.join(__dirname, 'public')));

// Keep a simple memory queue of recent messages to send to new connections
const messageHistory = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send message history to the newly connected user
  socket.emit('history', messageHistory);

  socket.on('sendMessage', (data) => {
    // data format: { from: 'Browser', text: '...', timestamp: 123 }
    const message = {
      id: Date.now().toString(),
      from: data.from || 'Web Client',
      text: data.text || '',
      photo: data.photo || null,
      timestamp: Date.now()
    };

    // Store in history
    messageHistory.push(message);
    if (messageHistory.length > 50) {
      messageHistory.shift();
    }

    // Broadcast to everyone (including the Electron app)
    io.emit('newMessage', message);
    console.log(`Message from ${message.from}: ${message.text.substring(0, 30)}...`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web Chat Server is running on port ${PORT}`);
});
