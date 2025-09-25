const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


const redisPublisher = createClient();
const redisSubscriber = createClient();

(async () => {
  await redisPublisher.connect();
  await redisSubscriber.connect();

  // Subscribe ONCE
  await redisSubscriber.subscribe('room-1', (message) => {
    const chatMsg = JSON.parse(message);
    io.emit('chatMessage', chatMsg); // broadcast to all clients
  });
})();

// Socket.IO handling
io.on("connection", (socket) => {
  console.log("New user joined:", socket.id);

  socket.on("user-message", async (message) => {
    console.log("Received from client:", message);

    
    await redisPublisher.publish('room-1', JSON.stringify({
      id: socket.id,
      text: message
    }));
  });
});

server.listen(7000, () => console.log("🚀 Server running on http://localhost:7000"));
