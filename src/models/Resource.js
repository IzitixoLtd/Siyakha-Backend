/**
 * Resource Model
 */

const mongoose = require('mongoose');
const { RESOURCE_CATEGORIES } = require('../config/constants');

const resourceSchema = new mongoose.Schema({
  category: { type: String, enum: RESOURCE_CATEGORIES, required: true },
  subject: { type: String, required: true, lowercase: true },
  grade: { type: Number, required: true, enum: [10, 11, 12] },
  year: Number,
  title: { type: String, required: true, trim: true },
  description: String,
  file: {
    url: { type: String, required: true },
    key: String,
    filename: String,
    mimeType: String,
    sizeBytes: Number,
    sizeMB: Number
  },
  thumbnailUrl: String,
  paperDetails: {
    paperNumber: Number,
    type: { type: String, enum: ['question_paper', 'memorandum', 'worksheet'] },
    examBody: { type: String, enum: ['NSC', 'IEB', 'other'] }
  },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visibility: { type: String, enum: ['all_grades', 'specific_grades'], default: 'all_grades' },
  visibleToGrades: [Number],
  stats: {
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  deletedAt: Date
}, { timestamps: true });

resourceSchema.index({ institutionId: 1, category: 1, subject: 1, grade: 1 });
resourceSchema.index({ title: 'text', description: 'text' });

resourceSchema.methods.incrementViews = function() {
  this.stats.viewCount += 1;
  return this.save();
};

resourceSchema.methods.incrementDownloads = function() {
  this.stats.downloadCount += 1;
  return this.save();
};

resourceSchema.methods.canView = function(user) {
  if (!user.institutionId?.equals(this.institutionId)) return false;
  if (user.role === 'student' && this.visibility === 'specific_grades') {
    return this.visibleToGrades.includes(user.studentProfile?.grade);
  }
  return true;
};

module.exports = mongoose.model('Resource', resourceSchema);
