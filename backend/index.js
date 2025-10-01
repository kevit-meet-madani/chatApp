const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const red = require('ioredis');
const path = require('path');

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

    let len = await redisPublisher.lLen("msgs");
    if(len >= 50){
      while(len > 0){
        await redisPublisher.lPop("msgs");
        len--;
      }
    }

    const lastMessages = await redisPublisher.lRange("msgs", -50, -1);
    const parsed = lastMessages.map(msg => JSON.parse(msg));
    io.emit("msgs", parsed);
  })

  socket.on("left", async(user) => {
    await redisPublisher.sRem("online-users",user);
    const users = await redisPublisher.sMembers("online-users");
    io.emit("onlineUsers",users);
  })

  socket.on("user-message", async (message) => {
    console.log("Received from client:", message);

    

    const chatMessage = {
    user: socket.id, 
    text: message,
    timestamp: Date.now()
  };

    await redisPublisher.rPush("msgs",JSON.stringify(chatMessage));
    await redisPublisher.lTrim("msgs",-50,-1);
    
    await redisPublisher.publish('room-1', JSON.stringify(chatMessage));
  });
});

app.get('/',(req,res,next) => {
    res.status(200).json({
        message:"Working"
    })
});

// app.use(express.static(path.join(__dirname, '../frontend/.angular/cache/17.3.17/frontend/.tsbuildinfo')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/.angular/cache/17.3.17/frontend/.tsbuildinfo'));
// });


server.listen(7000,() => {
  console.log('Server running on port 7000');
});


