/**
 * Request Validation Middleware
 */

const { body, param, query, validationResult } = require('express-validator');
const { GRADES, RESOURCE_CATEGORIES, QUIZ_MODES } = require('../config/constants');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  handleValidation
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidation
];

const validateInstitutionRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('institutionCode').trim().notEmpty(),
  handleValidation
];

const validateMongoId = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage('Invalid ID format'),
  handleValidation
];

const validateSubmitQuiz = [
  body('quizId').isMongoId(),
  body('answers').isObject(),
  handleValidation
];

const validateCreateAnnouncement = [
  body('title').trim().notEmpty(),
  body('body').trim().notEmpty(),
  body('targetGrades').isArray({ min: 1 }),
  handleValidation
];

module.exports = {
  handleValidation, validateRegister, validateLogin,
  validateInstitutionRegister, validateMongoId,
  validateSubmitQuiz, validateCreateAnnouncement
};
