const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate } = require('../middleware/auth');
const { validateMongoId, validateSubmitQuiz } = require('../middleware/validate');

router.get('/subjects', quizController.getSubjects);
router.get('/subjects/:subject/topics', quizController.getTopics);

router.use(authenticate);

router.get('/:mode/:subject/:topic', quizController.getQuiz);
router.get('/id/:id', validateMongoId('id'), quizController.getQuizById);
router.post('/results', validateSubmitQuiz, quizController.submitResult);
router.get('/results', quizController.getMyResults);
router.get('/results/averages', quizController.getMyAverages);
router.get('/results/:id', validateMongoId('id'), quizController.getResultById);
router.get('/leaderboard', quizController.getLeaderboard);

module.exports = router;
