/**
 * QuizResult Model
 */

const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  quizTitle: String,
  subject: { type: String, required: true },
  topic: String,
  grade: { type: Number, required: true },
  mode: { type: String, enum: ['practice', 'test'], required: true },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  score: { type: Number, required: true, min: 0, max: 100 },
  correctCount: { type: Number, required: true },
  incorrectCount: { type: Number, required: true },
  skippedCount: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  pointsEarned: Number,
  totalPoints: Number,
  passed: Boolean,
  timeTakenSec: Number,
  timeAllowedSec: Number,
  timedOut: { type: Boolean, default: false },
  answers: [{
    questionId: String,
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    pointsEarned: Number
  }],
  attemptNumber: { type: Number, default: 1 },
  startedAt: Date,
  completedAt: { type: Date, default: Date.now },
  syncedAt: Date,
  clientId: String
}, { timestamps: true });

quizResultSchema.index({ userId: 1, completedAt: -1 });
quizResultSchema.index({ institutionId: 1, grade: 1, subject: 1 });

quizResultSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments({ userId: this.userId, quizId: this.quizId });
    this.attemptNumber = count + 1;
  }
  next();
});

quizResultSchema.statics.getUserResults = function(userId, options = {}) {
  const query = { userId };
  if (options.subject) query.subject = options.subject;
  if (options.mode) query.mode = options.mode;
  return this.find(query).select('-answers').sort({ completedAt: -1 }).limit(options.limit || 20);
};

quizResultSchema.statics.getUserAverageBySubject = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$subject', avgScore: { $avg: '$score' }, totalAttempts: { $sum: 1 } } },
    { $project: { _id: 0, subject: '$_id', avgScore: { $round: ['$avgScore', 1] }, totalAttempts: 1 } },
    { $sort: { subject: 1 } }
  ]);
};

quizResultSchema.statics.getLeaderboard = function(institutionId, grade, options = {}) {
  const match = { institutionId: new mongoose.Types.ObjectId(institutionId), grade };
  if (options.subject) match.subject = options.subject;
  return this.aggregate([
    { $match: match },
    { $group: { _id: '$userId', avgScore: { $avg: '$score' }, totalAttempts: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 0, userId: '$_id', displayName: '$user.displayName', avgScore: { $round: ['$avgScore', 1] }, totalAttempts: 1 } },
    { $sort: { avgScore: -1 } },
    { $limit: options.limit || 10 }
  ]);
};

module.exports = mongoose.model('QuizResult', quizResultSchema);
