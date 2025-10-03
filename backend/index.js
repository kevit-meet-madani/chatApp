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
// import 'dotenv/config';
const { GoogleGenAI } =  require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
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

app.delete('/tasks/delete/:id', async(req,res,next) => {
   const id = req.params.id;

   try{
     const result = await pool.query(
      'DELETE FROM tasks where id = $1',[id]
      )

      const ans = result.rows;
      return res.json(ans);
   }
   catch(error){
    console.log(error);
   }
})

app.post('/tasks/add/:roomid', async(req,res,next) => {
    const { roomid } = req.params;

    try{

      const result = await pool.query(
      'INSERT INTO tasks (roomid,"name","status",description,assigned_to) VALUES ($1,$2,$3,$4,$5);',[roomid,req.body.name,req.body.status,req.body.description,req.body.assigned_to]
      )
    }
    catch(error){
      console.log(error);
    }
})
app.get('/tasks/:roomid', async(req,res,next) => {
  const { roomid } = req.params;
  try{
    

    const cachedTasks = await redis.get(`room:${roomid}:tasks`);
    if (cachedTasks) {
      console.log("✅ Cache hit");
      return res.json(JSON.parse(cachedTasks));
    }

    const result = await pool.query(
      'SELECT id,name,status,description,assigned_to from tasks where roomid = $1',[roomid]
    )

    const tasks = result.rows;

    await redis.set(`room:${roomid}:tasks`, JSON.stringify(tasks), "EX", 30);

    res.json(tasks);
  }

  catch(error){
    console.log(error);
  }
})

app.patch('/tasks/edit/:id', async (req,res,next) => {
    const { id } = req.params;
    console.log(req.body);
    try{
      const result = await pool.query(
      `UPDATE tasks SET status = $1 WHERE id = $2`,[req.body.status,id]
    )
      const ans = result.rows;

      return res.json(ans);
    }
    catch(error){
      console.log(error);
    }
})

app.patch('/tasks/edit/full/:id', async (req,res,next) => {
    const { id } = req.params;
    console.log(req.body);
    try{
      const result = await pool.query(
      `UPDATE tasks SET status = $1,name = $2,description = $3,assigned_to = $4 WHERE id = $5`,[req.body.status,req.body.name,req.body.description,req.body.assigned_to,id]
    )
      const ans = result.rows;

      return res.json(ans);
    }
    catch(error){
      console.log(error);
    }
})

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


app.get('/generate-ai-report/:roomid', async (req, res) => {

    const { roomid } = req.params;

    const chatMessages = await pool.query(
      `SELECT m.name, m.content, m.created_at
       FROM messages m
       WHERE roomid = $1
       ORDER BY m.created_at ASC`,
      [roomid]
    );

    const Messages = chatMessages.rows;    

    const taskList = await pool.query(
      'SELECT id,name,status,description,assigned_to from tasks where roomid = $1',[roomid]
    )

    const taskLists = taskList.rows;
    // You could dynamically load or use data sent in req.body here
    const systemInstruction = `You are a senior software developer having command accross all technologies like react.js , angular , node.js , nestjs ,redis , rabbitmq , go , python , flutter , .NET , C-sharp etc.. Your task is to analyze the provided team chat messages and task list to generate a concise status report using **Markdown**.`;
    const userPrompt = `
        Please generate a project status report based on the following data.
 
        **Report Requirements:**
        1. **Summary:** A 2-3 sentence summary of the team's activity and overall status.
        2. **Blockers/Risks:** Identify any open or resolved blockers/risks mentioned in the chats.
        3. **Task Status Table:** A Markdown table summarizing the current status of all tasks, including any progress noted in the chats.
 
        **Chat Messages Data (JSON Array):**
        ${JSON.stringify(Messages, null, 2)}
 
        **Task List Data (JSON Array):**
        ${JSON.stringify(taskLists, null, 2)}
    `;
 
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction 
            }
        });
        // Return the report text back to the Angular client
        res.json({ reportMarkdown: response.text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to generate report" });
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

 

