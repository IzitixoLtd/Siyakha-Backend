/**
 * API Routes Index
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const quizRoutes = require('./quizzes');
const resourceRoutes = require('./resources');
const announcementRoutes = require('./announcements');
const universityRoutes = require('./universities');
const agentRoutes = require('./agent');

router.get('/', (req, res) => {
  res.json({
    name: 'Siyakha API',
    version: '1.0.0',
    endpoints: { auth: '/api/auth', quizzes: '/api/quizzes', resources: '/api/resources', announcements: '/api/announcements', universities: '/api/universities', agent: '/api/agent' }
  });
});

router.use('/auth', authRoutes);
router.use('/quizzes', quizRoutes);
router.use('/resources', resourceRoutes);
router.use('/announcements', announcementRoutes);
router.use('/universities', universityRoutes);
router.use('/agent', agentRoutes);

module.exports = router;
