/**
 * Agent Siyakha Controller
 */

const AgentConversation = require('../models/AgentConversation');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/apiResponse');

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await AgentConversation.getUserConversations(req.userId, { status: req.query.status });
  return response.success(res, conversations);
});

const getConversation = asyncHandler(async (req, res) => {
  const conversation = await AgentConversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) return response.notFound(res, 'Conversation not found');
  return response.success(res, conversation);
});

const createConversation = asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  const conversation = await AgentConversation.createConversation(req.userId, message, context);

  if (message) {
    const aiResponse = getMockResponse(message);
    await conversation.addMessage('assistant', aiResponse, { model: 'mock', responseTimeMs: 100 });
  }
  return response.created(res, conversation);
});

const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const conversation = await AgentConversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) return response.notFound(res, 'Conversation not found');

  const userMessage = await conversation.addMessage('user', message);
  const aiResponse = getMockResponse(message);
  const assistantMessage = await conversation.addMessage('assistant', aiResponse, { model: 'mock', responseTimeMs: 100 });

  return response.success(res, { userMessage, assistantMessage });
});

const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await AgentConversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) return response.notFound(res, 'Conversation not found');
  conversation.status = 'archived';
  await conversation.save();
  return response.success(res, null, 'Conversation archived');
});

function getMockResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('math') || lower.includes('equation')) {
    return "Great question about mathematics! Let me help you step by step. What specific concept are you struggling with?";
  }
  if (lower.includes('university') || lower.includes('application')) {
    return "University applications in South Africa require your APS score, ID copy, and Grade 11/12 results. What university are you interested in?";
  }
  if (lower.includes('study') || lower.includes('exam')) {
    return "Here are some study tips: 1) Use active recall, 2) Practice with past papers, 3) Take regular breaks (Pomodoro technique), 4) Teach concepts to others. What subject are you preparing for?";
  }
  return "Hello! I'm Agent Siyakha, your AI study buddy. I can help with subjects, university applications, and study tips. What would you like to learn about?";
}

module.exports = { getConversations, getConversation, createConversation, sendMessage, deleteConversation };
