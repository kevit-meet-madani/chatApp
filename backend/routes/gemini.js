const express = require('express');
const router = express.Router();
const aiController = require('../controllers/gemini');

router.get('/generate-ai-report/:roomid',aiController.callAi);

module.exports = router;