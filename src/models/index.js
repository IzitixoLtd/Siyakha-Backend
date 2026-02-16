/**
 * Models Index
 */

const User = require('./User');
const Institution = require('./Institution');
const Quiz = require('./Quiz');
const QuizResult = require('./QuizResult');
const Resource = require('./Resource');
const Announcement = require('./Announcement');
const University = require('./University');
const AgentConversation = require('./AgentConversation');

module.exports = {
  User, Institution, Quiz, QuizResult,
  Resource, Announcement, University, AgentConversation
};
