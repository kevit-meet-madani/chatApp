const express = require("express");
require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const Redis = require("ioredis");
const app = express();
const cors = require('cors');
const path = require('path');
const aiRoutes = require('./routes/gemini');
const taskRoutes = require('./routes/task');
const chatRoutes = require('./routes/chat');

app.use(cors());

// app.use(express.static(path.join(__dirname, '/home/kevit/Meet Data/chatApp/frontend/dist/frontend')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '/home/kevit/Meet Data/chatApp/frontend/dist/frontend/browserindex.html'));
// });

const server = http.createServer(app);
const io = new Server(server); 
app.use(express.json());
 
// PostgreSQL pool

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD || '',
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

app.use('/tasks',taskRoutes);

app.use('/chat',chatRoutes);

app.use('/ai',aiRoutes);
 


 
// Get messages of a room (with Redis cache)

 
// Socket.IO connections

io.on("connection", (socket) =>  {

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

 

