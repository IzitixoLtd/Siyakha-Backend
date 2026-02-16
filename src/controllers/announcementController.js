/**
 * Announcement Controller
 */

const Announcement = require('../models/Announcement');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/apiResponse');

const getAnnouncements = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  if (!req.user.institutionId) return response.success(res, []);

  if (req.user.role !== 'student') {
    const announcements = await Announcement.find({ institutionId: req.user.institutionId, status: 'published' })
      .sort({ isPinned: -1, publishedAt: -1 }).limit(parseInt(limit, 10) || 20);
    return response.success(res, announcements);
  }

  const grade = req.user.studentProfile?.grade;
  if (!grade) return response.badRequest(res, 'Grade not set');
  const announcements = await Announcement.getForStudent(req.user.institutionId, grade, req.userId, { limit: parseInt(limit, 10) || 20 });
  return response.success(res, announcements);
});

const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'displayName');
  if (!announcement) return response.notFound(res, 'Announcement not found');
  if (!announcement.isVisibleTo(req.user)) return response.forbidden(res, 'Access denied');
  return response.success(res, announcement);
});

const markAsRead = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return response.notFound(res, 'Announcement not found');
  await announcement.markAsRead(req.userId);
  return response.success(res, null, 'Marked as read');
});

const getUnreadCount = asyncHandler(async (req, res) => {
  if (!req.user.institutionId || req.user.role !== 'student') return response.success(res, { count: 0 });
  const grade = req.user.studentProfile?.grade;
  if (!grade) return response.success(res, { count: 0 });
  const count = await Announcement.getUnreadCount(req.user.institutionId, grade, req.userId);
  return response.success(res, { count });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, targetGrades, targetSubjects, priority, expiresAt, publish } = req.body;
  if (!req.user.institutionId) return response.badRequest(res, 'Institution required');

  const announcement = new Announcement({
    title, body, targetGrades,
    targetSubjects: targetSubjects || null,
    priority: priority || 'normal',
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    institutionId: req.user.institutionId,
    createdBy: req.userId,
    createdByName: req.user.displayName,
    createdByRole: req.user.role,
    status: publish ? 'published' : 'draft',
    publishedAt: publish ? new Date() : null
  });
  await announcement.save();
  return response.created(res, announcement, 'Announcement created');
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, targetGrades, priority, status } = req.body;
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return response.notFound(res, 'Announcement not found');

  if (title) announcement.title = title;
  if (body) announcement.body = body;
  if (targetGrades) announcement.targetGrades = targetGrades;
  if (priority) announcement.priority = priority;
  if (status) {
    announcement.status = status;
    if (status === 'published' && !announcement.publishedAt) announcement.publishedAt = new Date();
  }
  await announcement.save();
  return response.success(res, announcement, 'Announcement updated');
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  return response.success(res, null, 'Announcement deleted');
});

module.exports = { getAnnouncements, getAnnouncement, markAsRead, getUnreadCount, createAnnouncement, updateAnnouncement, deleteAnnouncement };
