const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task');

router.delete('/delete/:id',taskController.deleteTask);

router.post('/add/:roomid',taskController.addTask);

router.get('/:roomid',taskController.getTasks);

router.patch('/edit/:id',taskController.updateTasksStatus);

router.patch('/edit/full/:id',taskController.updateTask);

module.exports = router;