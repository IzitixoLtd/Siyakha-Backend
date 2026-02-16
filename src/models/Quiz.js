/**
 * Quiz Model
 */

const mongoose = require('mongoose');
const { QUIZ_MODES, QUESTION_TYPES } = require('../config/constants');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: QUESTION_TYPES, required: true },
  question: { type: String, required: true },
  options: [String],
  matchPairs: { type: Map, of: String },
  answer: mongoose.Schema.Types.Mixed,
  answerKeywords: [String],
  points: { type: Number, default: 1 },
  explanation: String,
  hint: String
}, { _id: false });

const quizSchema = new mongoose.Schema({
  quizKey: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true, lowercase: true },
  subjectLabel: String,
  topic: { type: String, required: true, lowercase: true },
  topicLabel: String,
  section: String,
  grade: { type: Number, required: true, enum: [10, 11, 12] },
  mode: { type: String, enum: Object.values(QUIZ_MODES), required: true },
  timeLimitSec: Number,
  passingScore: { type: Number, default: 50 },
  totalPoints: Number,
  questions: [questionSchema],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  isPublished: { type: Boolean, default: true },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

quizSchema.index({ quizKey: 1 }, { unique: true });
quizSchema.index({ subject: 1, topic: 1, grade: 1, mode: 1 });

quizSchema.pre('save', function(next) {
  if (this.questions?.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }
  next();
});

quizSchema.methods.toStudentJSON = function() {
  const obj = this.toObject();
  obj.questions = obj.questions.map(q => {
    const { answer, answerKeywords, ...rest } = q;
    return rest;
  });
  return obj;
};

quizSchema.methods.gradeAnswers = function(answers) {
  const details = [];
  let correctCount = 0;
  let pointsEarned = 0;

  for (const question of this.questions) {
    const userAnswer = answers[question.id];
    let isCorrect = false;

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      isCorrect = String(userAnswer || '').toLowerCase() === String(question.answer || '').toLowerCase();
    } else if (question.type === 'select_multiple_answers' && Array.isArray(userAnswer)) {
      const userSet = new Set(userAnswer.map(a => String(a).toLowerCase()));
      const answerSet = new Set((question.answer || []).map(a => String(a).toLowerCase()));
      isCorrect = userSet.size === answerSet.size && [...userSet].every(a => answerSet.has(a));
    }

    if (isCorrect) {
      correctCount++;
      pointsEarned += question.points || 1;
    }

    details.push({
      questionId: question.id,
      userAnswer,
      correctAnswer: question.answer,
      isCorrect,
      pointsEarned: isCorrect ? (question.points || 1) : 0,
      explanation: question.explanation
    });
  }

  const score = Math.round((pointsEarned / this.totalPoints) * 100);
  return {
    score,
    correctCount,
    incorrectCount: this.questions.length - correctCount,
    totalQuestions: this.questions.length,
    pointsEarned,
    totalPoints: this.totalPoints,
    passed: score >= this.passingScore,
    details
  };
};

quizSchema.statics.getSubjects = async function(grade) {
  const match = { isPublished: true };
  if (grade) match.grade = grade;
  return this.aggregate([
    { $match: match },
    { $group: { _id: { subject: '$subject', subjectLabel: '$subjectLabel' }, count: { $sum: 1 } } },
    { $project: { _id: 0, subject: '$_id.subject', subjectLabel: '$_id.subjectLabel', count: 1 } },
    { $sort: { subjectLabel: 1 } }
  ]);
};

quizSchema.statics.getTopics = async function(subject, grade, mode) {
  const match = { subject: subject.toLowerCase(), isPublished: true };
  if (grade) match.grade = grade;
  if (mode) match.mode = mode;
  return this.aggregate([
    { $match: match },
    { $group: { _id: { topic: '$topic', topicLabel: '$topicLabel' }, count: { $sum: 1 } } },
    { $project: { _id: 0, topic: '$_id.topic', topicLabel: '$_id.topicLabel', count: 1 } },
    { $sort: { topicLabel: 1 } }
  ]);
};

quizSchema.statics.findQuiz = function(mode, subject, topic, grade) {
  return this.findOne({ mode, subject: subject.toLowerCase(), topic: topic.toLowerCase(), grade, isPublished: true });
};

module.exports = mongoose.model('Quiz', quizSchema);
