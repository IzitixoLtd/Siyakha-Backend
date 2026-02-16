/**
 * Announcement Model
 */

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  attachments: [{ filename: String, url: String, mimeType: String }],
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  targetGrades: { type: [Number], required: true },
  targetSubjects: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: String,
  createdByRole: String,
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  expiresAt: Date,
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  isPinned: { type: Boolean, default: false },
  readBy: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: { type: Date, default: Date.now } }],
  readCount: { type: Number, default: 0 }
}, { timestamps: true });

announcementSchema.index({ institutionId: 1, status: 1, publishedAt: -1 });
announcementSchema.index({ institutionId: 1, targetGrades: 1 });

announcementSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

announcementSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(r => r.userId.equals(userId))) {
    this.readBy.push({ userId, readAt: new Date() });
    this.readCount = this.readBy.length;
    return this.save();
  }
  return Promise.resolve(this);
};

announcementSchema.methods.isVisibleTo = function(user) {
  if (!user.institutionId?.equals(this.institutionId)) return false;
  if (user.role === 'student') return this.targetGrades.includes(user.studentProfile?.grade);
  return true;
};

announcementSchema.statics.getForStudent = function(institutionId, grade, userId, options = {}) {
  return this.find({
    institutionId, targetGrades: grade, status: 'published',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  }).sort({ isPinned: -1, publishedAt: -1 }).limit(options.limit || 20).lean()
    .then(anns => anns.map(a => ({ ...a, isRead: a.readBy?.some(r => r.userId.equals(userId)) || false })));
};

announcementSchema.statics.getUnreadCount = function(institutionId, grade, userId) {
  return this.countDocuments({
    institutionId, targetGrades: grade, status: 'published',
    'readBy.userId': { $ne: userId },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  });
};

module.exports = mongoose.model('Announcement', announcementSchema);
