/**
 * AgentConversation Model
 */

const mongoose = require('mongoose');

const agentConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: [{
    id: String,
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: String,
    metadata: { model: String, tokensUsed: Number, responseTimeMs: Number },
    timestamp: { type: Date, default: Date.now }
  }],
  context: {
    currentSubject: String,
    currentTopic: String,
    relatedQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }
  },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  messageRatings: [{ messageId: String, rating: { type: String, enum: ['helpful', 'not_helpful'] }, feedback: String }],
  lastMessageAt: { type: Date, default: Date.now },
  syncedAt: Date
}, { timestamps: true });

agentConversationSchema.index({ userId: 1, updatedAt: -1 });

agentConversationSchema.pre('save', function(next) {
  if (this.messages?.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp || new Date();
    if (this.isNew && this.title === 'New Conversation') {
      const firstMsg = this.messages.find(m => m.role === 'user');
      if (firstMsg) this.title = firstMsg.content.substring(0, 50) + (firstMsg.content.length > 50 ? '...' : '');
    }
  }
  next();
});

agentConversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  const message = { id: new mongoose.Types.ObjectId().toString(), role, content, metadata, timestamp: new Date() };
  this.messages.push(message);
  this.lastMessageAt = message.timestamp;
  return this.save().then(() => message);
};

agentConversationSchema.methods.getMessagesForAI = function() {
  return this.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
};

agentConversationSchema.statics.getUserConversations = function(userId, options = {}) {
  return this.find({ userId, status: options.status || 'active' })
    .select('title lastMessageAt context.currentSubject status createdAt')
    .sort({ lastMessageAt: -1 }).limit(options.limit || 20);
};

agentConversationSchema.statics.createConversation = function(userId, initialMessage, context = {}) {
  const conversation = new this({
    userId,
    messages: initialMessage ? [{ id: new mongoose.Types.ObjectId().toString(), role: 'user', content: initialMessage, timestamp: new Date() }] : [],
    context
  });
  return conversation.save();
};

module.exports = mongoose.model('AgentConversation', agentConversationSchema);
