const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');

router.post('/join',chatController.authUser);

router.get('/users/:roomId',chatController.getUsers);

router.get('/messages/:roomId',chatController.getMessages);

module.exports = router;