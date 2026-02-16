const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, verifyRefreshToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', verifyRefreshToken, authController.refreshToken);
router.post('/verify-school-code', authController.verifySchoolCode);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
