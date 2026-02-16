/**
 * Quiz Controller
 */

const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/apiResponse');

const getSubjects = asyncHandler(async (req, res) => {
  const { grade } = req.query;
  const subjects = await Quiz.getSubjects(grade ? parseInt(grade, 10) : null);
  return response.success(res, subjects);
});

const getTopics = asyncHandler(async (req, res) => {
  const { subject } = req.params;
  const { grade, mode } = req.query;
  const topics = await Quiz.getTopics(subject, grade ? parseInt(grade, 10) : null, mode);
  return response.success(res, topics);
});

const getQuiz = asyncHandler(async (req, res) => {
  const { mode, subject, topic } = req.params;
  const { grade } = req.query;
  const targetGrade = grade ? parseInt(grade, 10) : req.user?.studentProfile?.grade || 12;

  const quiz = await Quiz.findQuiz(mode, subject, topic, targetGrade);
  if (!quiz) return response.notFound(res, 'Quiz not found');
  return response.success(res, quiz.toStudentJSON());
});

const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return response.notFound(res, 'Quiz not found');
  return response.success(res, quiz.toStudentJSON());
});

const submitResult = asyncHandler(async (req, res) => {
  const { quizId, answers, timeTakenSec, startedAt, clientId } = req.body;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) return response.notFound(res, 'Quiz not found');

  const gradeResult = quiz.gradeAnswers(answers);

  const result = new QuizResult({
    userId: req.userId,
    quizId: quiz._id,
    quizTitle: quiz.title,
    subject: quiz.subject,
    topic: quiz.topic,
    grade: quiz.grade,
    mode: quiz.mode,
    institutionId: req.user.institutionId,
    score: gradeResult.score,
    correctCount: gradeResult.correctCount,
    incorrectCount: gradeResult.incorrectCount,
    totalQuestions: gradeResult.totalQuestions,
    pointsEarned: gradeResult.pointsEarned,
    totalPoints: gradeResult.totalPoints,
    passed: gradeResult.passed,
    timeTakenSec,
    timeAllowedSec: quiz.timeLimitSec,
    answers: gradeResult.details,
    startedAt: startedAt ? new Date(startedAt) : undefined,
    completedAt: new Date(),
    clientId
  });
  await result.save();

  return response.created(res, {
    resultId: result._id,
    score: result.score,
    passed: result.passed,
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    attemptNumber: result.attemptNumber,
    ...(quiz.mode === 'practice' && { details: gradeResult.details })
  }, 'Quiz submitted');
});

const getMyResults = asyncHandler(async (req, res) => {
  const { subject, mode, limit } = req.query;
  const results = await QuizResult.getUserResults(req.userId, { subject, mode, limit: parseInt(limit, 10) || 20 });
  return response.success(res, results);
});

const getMyAverages = asyncHandler(async (req, res) => {
  const averages = await QuizResult.getUserAverageBySubject(req.userId);
  return response.success(res, averages);
});

const getResultById = asyncHandler(async (req, res) => {
  const result = await QuizResult.findOne({ _id: req.params.id, userId: req.userId });
  if (!result) return response.notFound(res, 'Result not found');
  return response.success(res, result);
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const { grade, subject, limit } = req.query;
  if (!req.user.institutionId) return response.badRequest(res, 'Institution required');
  const targetGrade = grade ? parseInt(grade, 10) : req.user.studentProfile?.grade;
  if (!targetGrade) return response.badRequest(res, 'Grade required');

  const leaderboard = await QuizResult.getLeaderboard(req.user.institutionId, targetGrade, { subject, limit: parseInt(limit, 10) || 10 });
  return response.success(res, leaderboard);
});

module.exports = { getSubjects, getTopics, getQuiz, getQuizById, submitResult, getMyResults, getMyAverages, getResultById, getLeaderboard };
