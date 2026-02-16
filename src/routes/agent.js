const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { authenticate } = require('../middleware/auth');
const { aiChatLimiter } = require('../middleware/rateLimit');
const { validateMongoId } = require('../middleware/validate');

router.use(authenticate);

router.get('/conversations', agentController.getConversations);
router.post('/conversations', aiChatLimiter, agentController.createConversation);
router.get('/conversations/:id', validateMongoId('id'), agentController.getConversation);
router.post('/conversations/:id/messages', aiChatLimiter, validateMongoId('id'), agentController.sendMessage);
router.delete('/conversations/:id', validateMongoId('id'), agentController.deleteConversation);

module.exports = router;
