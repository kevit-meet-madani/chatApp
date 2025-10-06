const Redis = require("ioredis");
const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,  
});

pool.connect()
  .then(() => console.log('✅ Connected successfully'))
  .catch(err => console.error('❌ Connection failed', err));

  const redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
  });

exports.deleteTask = async(req,res,next) => {
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
};

exports.addTask = async(req,res,next) => {
    const { roomid } = req.params;

    try{

      const result = await pool.query(
      'INSERT INTO tasks (roomid,"name","status",description,assigned_to) VALUES ($1,$2,$3,$4,$5);',[roomid,req.body.name,req.body.status,req.body.description,req.body.assigned_to]
      )
    }
    catch(error){
      console.log(error);
    }
}

exports.getTasks = async(req,res,next) => {
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
};

exports.updateTasksStatus = async (req,res,next) => {
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
}

exports.updateTask = async (req,res,next) => {
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
};

