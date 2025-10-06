const { GoogleGenAI } = require("@google/genai");
const { Pool } = require("pg");
require('dotenv').config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

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

exports.callAi = async(req,res,next) => {

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
        1. **Summary:** A detailed sentence summary of the team's activity and overall status.
        2. **Suggestions:** Analyze task list data properly and observe who has assigned which type of tasks and verify that that person is going correctly or not from their conversation in chat messages array, if not than provide that person a detailed roadmap to complete their task and a persons who are going right way help them to provide more optimization to complete their task.
        3. **Task Status Table:** A Markdown table summarizing the current status of all tasks, including any progress noted in the chats.
 
        **Chat Messages Data (JSON Array):**
        ${JSON.stringify(Messages, null, 2)}
 
        **Task List Data (JSON Array):**
        ${JSON.stringify(taskLists, null, 2)}

        You are feel free to take any amount of time but i need quality and proper response as required.
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
        console.log(response.candidates[0].content.parts[0].text);
        const ans = response.candidates[0].content.parts[0].text;
        return res.json(ans);
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to generate report" });
    }
};