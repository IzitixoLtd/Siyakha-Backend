/**
 * Resource Controller
 */

const Resource = require('../models/Resource');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/apiResponse');
const { parsePagination } = require('../utils/helpers');

const getResources = asyncHandler(async (req, res) => {
  const { category, subject, grade, year, sortBy } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  if (!req.user.institutionId) return response.badRequest(res, 'Institution required');

  const query = { institutionId: req.user.institutionId, isActive: true };
  if (category) query.category = category;
  if (subject) query.subject = subject.toLowerCase();
  if (grade) query.grade = parseInt(grade, 10);
  if (year) query.year = parseInt(year, 10);

  const [resources, total] = await Promise.all([
    Resource.find(query).sort(sortBy === 'downloads' ? { 'stats.downloadCount': -1 } : { createdAt: -1 })
      .skip(skip).limit(limit).populate('uploadedBy', 'displayName'),
    Resource.countDocuments(query)
  ]);

  return response.paginated(res, resources, { page, limit, total });
});

const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate('uploadedBy', 'displayName');
  if (!resource?.isActive) return response.notFound(res, 'Resource not found');
  if (!resource.canView(req.user)) return response.forbidden(res, 'Access denied');
  await resource.incrementViews();
  return response.success(res, resource);
});

const downloadResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource?.isActive) return response.notFound(res, 'Resource not found');
  if (!resource.canView(req.user)) return response.forbidden(res, 'Access denied');
  await resource.incrementDownloads();
  return response.success(res, { url: resource.file.url, filename: resource.file.filename });
});

const createResource = asyncHandler(async (req, res) => {
  const { title, description, category, subject, grade, year, visibility, visibleToGrades, paperDetails } = req.body;
  if (!req.user.institutionId) return response.badRequest(res, 'Institution required');
  if (!req.file) return response.badRequest(res, 'File required');

  const resource = new Resource({
    title, description, category,
    subject: subject.toLowerCase(),
    grade: parseInt(grade, 10),
    year: year ? parseInt(year, 10) : undefined,
    file: { url: req.file.path || req.file.url, key: req.file.filename, filename: req.file.originalname, mimeType: req.file.mimetype, sizeBytes: req.file.size },
    paperDetails: category === 'past-papers' ? paperDetails : undefined,
    institutionId: req.user.institutionId,
    uploadedBy: req.userId,
    visibility: visibility || 'all_grades',
    visibleToGrades: visibility === 'specific_grades' ? visibleToGrades : []
  });
  await resource.save();
  return response.created(res, resource, 'Resource uploaded');
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource?.isActive) return response.notFound(res, 'Resource not found');
  if (!resource.uploadedBy.equals(req.userId) && !['admin', 'hod', 'principal'].includes(req.user.role)) {
    return response.forbidden(res, 'Permission denied');
  }
  resource.isActive = false;
  resource.deletedAt = new Date();
  await resource.save();
  return response.success(res, null, 'Resource deleted');
});

module.exports = { getResources, getResource, downloadResource, createResource, deleteResource };
