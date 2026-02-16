const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');

router.get('/', universityController.getUniversities);
router.get('/:key', universityController.getUniversity);
router.get('/:key/faculties', universityController.getFaculties);
router.get('/:key/courses/search', universityController.searchCourses);

module.exports = router;
