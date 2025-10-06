const Redis = require("ioredis");
const { Pool } = require("pg");
require('dotenv').config();

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

  const redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
  });

exports.authUser = async(req,res,next) => {
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
};

exports.getUsers = async (req, res) => {
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
};

exports.getMessages = async (req, res) => {
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

}
