// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const { createClient } = require('redis');
// const red = require('ioredis');
// const path = require('path');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });


// const redisPublisher = createClient();
// const redisSubscriber = createClient();

// (async () => {
//   await redisPublisher.connect();
//   await redisSubscriber.connect(); 

  
//   await redisSubscriber.subscribe('room-1', (message) => {
//     const chatMsg = JSON.parse(message);
//     io.emit('chatMessage', chatMsg);
//   });
// })();


// io.on("connection", (socket) => {
//   console.log("New user joined:", socket.id);

//   socket.on("newuser",async(user) => {
//     await redisPublisher.sAdd("online-users", user);
//     const users = await redisPublisher.sMembers("online-users");
//     console.log("Current online users:", users);
//     io.emit("onlineUsers",users);

//     let len = await redisPublisher.lLen("msgs");
//     if(len >= 50){
//       while(len > 0){
//         await redisPublisher.lPop("msgs");
//         len--;
//       }
//     }

//     const lastMessages = await redisPublisher.lRange("msgs", -50, -1);
//     const parsed = lastMessages.map(msg => JSON.parse(msg));
//     io.emit("msgs", parsed);
//   })

//   socket.on("left", async(user) => {
//     await redisPublisher.sRem("online-users",user);
//     const users = await redisPublisher.sMembers("online-users");
//     io.emit("onlineUsers",users);
//   })

//   socket.on("user-message", async (message) => {
//     console.log("Received from client:", message);

    

//     const chatMessage = {
//     user: socket.id, 
//     text: message,
//     timestamp: Date.now()
//   };

//     await redisPublisher.rPush("msgs",JSON.stringify(chatMessage));
//     await redisPublisher.lTrim("msgs",-50,-1);
    
//     await redisPublisher.publish('room-1', JSON.stringify(chatMessage));
//   });
// });

// app.get('/',(req,res,next) => {
//     res.status(200).json({
//         message:"Working"
//     })
// });

// // app.use(express.static(path.join(__dirname, '../frontend/.angular/cache/17.3.17/frontend/.tsbuildinfo')));

// // app.get('*', (req, res) => {
// //   res.sendFile(path.join(__dirname, '../frontend/.angular/cache/17.3.17/frontend/.tsbuildinfo'));
// // });


// server.listen(7000,() => {
//   console.log('Server running on port 7000');
// });

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const Redis = require("ioredis");
const app = express();
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);
const io = new Server(server); 
app.use(express.json());
 
// PostgreSQL pool

const pool = new Pool({
  user: "meet",
  host: process.env.DB_HOST,
  database: "mydb",
  password: "456",
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => console.log('✅ Connected successfully'))
  .catch(err => console.error('❌ Connection failed', err));

 
// Redis client

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

app.post('/join', async(req,res,next) => {
   try{
     const result = await pool.query(
      'SELECT name,roomid FROM users where name = $1 and password = $2',[req.body.name,req.body.password]
     );

     const rep = result.rows;
      
     if(rep.length !== 0){
       console.log(rep)
       return res.json(rep)
     }
     return res.status(404).json({
      message:"User not found!"
     })
   }
   catch(error){
    console.log(error);
   }
})
 
app.get('/users/:roomId', async (req, res) => {
  const { roomId } = req.params;
  console.log(roomId);

  try {
    // Check Redis cache
    const cachedUsers = await redis.get(`room:${roomId}:users`);
    if (cachedUsers) {
      console.log("✅ Cache hit");
      return res.json(JSON.parse(cachedUsers));
    }

    // Fetch from PostgreSQL
    const result = await pool.query(
      'SELECT name FROM users WHERE roomid = $1',
      [roomId]
    );
    const users = result.rows;

    // Cache in Redis for 30 seconds
    await redis.set(`room:${roomId}:users`, JSON.stringify(users), "EX", 30);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch users");
  }
});

 
// Get messages of a room (with Redis cache)

app.get("/messages/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    // 1. Check cache
    const cachedMessages = await redis.get(`room:${roomId}:messages`);
    if (cachedMessages) {
      console.log("✅ Cache hit");
      return res.json(JSON.parse(cachedMessages));
    }
    console.log("⚡ Cache miss, fetching from DB...");
    // 2. If not in cache, fetch from DB

    const result = await pool.query(
      `SELECT m.name, m.content, m.created_at
       FROM messages m
       WHERE roomid = $1
       ORDER BY m.created_at ASC`,
      [roomId]
    );
 
    const messages = result.rows;
 
    // 3. Store in Redis cache (expire after 30 seconds)

    await redis.set(`room:${roomId}:messages`, JSON.stringify(messages), "EX", 30);
    res.json(messages);
  } catch (err) {

    console.error(err);
    res.status(500).send("Failed to fetch messages");
  }

});
 
// Socket.IO connections

io.on("connection", (socket) => {

  console.log("A user connected:", socket.id);
  // Join a room

  socket.on("newuser", async({ roomid, username }) => {
    socket.join(roomid);
    console.log(`${username} joined room ${roomid}`);

    socket.to(roomid).emit("message", {
      user: "system",
      text: `${username} joined the room`,
    });

  });
 
  // Handle chat messages

  socket.on("user-message", async ({ roomid, name, content }) => {
    try {
      // Save to DB
      await pool.query(
        "INSERT INTO messages (name, roomid, content) VALUES ($1, $2, $3)",
        [name, roomid, content]
      );
      console.log("Dddddddddddddddddddddd")
      // 🔄 Invalidate cache (so new messages appear on next fetch)

      await redis.del(`room:${roomid}:messages`);
 
      // Broadcast to room

      io.to(roomid).emit("message", { name, content, roomid });

    } catch (err) {
      console.error(err);
    }

  });
 
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});
 
server.listen(7000, () => console.log("Server running on http://localhost:3000"));

 

