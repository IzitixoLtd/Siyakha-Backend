/**
 * University Controller
 */

const University = require('../models/University');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/apiResponse');

const getUniversities = asyncHandler(async (req, res) => {
  const universities = await University.getAllSummaries();
  return response.success(res, universities);
});

const getUniversity = asyncHandler(async (req, res) => {
  const university = await University.findOne({ key: req.params.key, isActive: true });
  if (!university) return response.notFound(res, 'University not found');
  return response.success(res, university);
});

const getFaculties = asyncHandler(async (req, res) => {
  const university = await University.findOne({ key: req.params.key, isActive: true }).select('faculties');
  if (!university) return response.notFound(res, 'University not found');
  const faculties = university.faculties.map(f => ({ key: f.key, name: f.name, description: f.description, courseCount: f.courses?.length || 0 }));
  return response.success(res, faculties);
});

const searchCourses = asyncHandler(async (req, res) => {
  const { q, aps } = req.query;
  const university = await University.findOne({ key: req.params.key, isActive: true });
  if (!university) return response.notFound(res, 'University not found');

  let courses;
  if (q) courses = university.searchCourses(q);
  else if (aps) courses = university.getAllCourses().filter(c => c.apsScore <= parseInt(aps, 10));
  else courses = university.getAllCourses();
  return response.success(res, courses);
});

module.exports = { getUniversities, getUniversity, getFaculties, searchCourses };
