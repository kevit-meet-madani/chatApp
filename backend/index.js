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

  
  await redisSubscriber.subscribe('room-1', (message) => {
    const chatMsg = JSON.parse(message);
    io.emit('chatMessage', chatMsg);
  });
})();


io.on("connection", (socket) => {
  console.log("New user joined:", socket.id);

  socket.on("newuser",async(user) => {
    await redisPublisher.sAdd("online-users", user);
    const users = await redisPublisher.sMembers("online-users");
    console.log("Current online users:", users);
    io.emit("onlineUsers",users);
  })

  socket.on("left", async(user) => {
    await redisPublisher.sRem("online-users",user);
    const users = await redisPublisher.sMembers("online-users");
    io.emit("onlineUsers",users);
  })

  socket.on("user-message", async (message) => {
    console.log("Received from client:", message);
    
    await redisPublisher.publish('room-1', JSON.stringify({
      id: socket.id,
      text: message
    }));
  });
});

app.get('/',(req,res,next) => {
    res.status(200).json({
        message:"Working"
    })
});

server.listen(7000, '0.0.0.0', () => {
  console.log('Server running on port 7000');
});


