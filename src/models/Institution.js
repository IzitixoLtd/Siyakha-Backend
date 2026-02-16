/**
 * Institution Model
 */

const mongoose = require('mongoose');
const { PROVINCES, GRADES, SUBJECTS } = require('../config/constants');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true
  },
  shortName: String,
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['public_school', 'private_school', 'tutoring_center', 'other'],
    default: 'public_school'
  },
  address: {
    street: String,
    city: String,
    province: { type: String, enum: PROVINCES },
    postalCode: String
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  principalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settings: {
    allowStudentSelfRegistration: { type: Boolean, default: true },
    allowTeacherSelfRegistration: { type: Boolean, default: false },
    requireApprovalForStudents: { type: Boolean, default: false },
    requireApprovalForTeachers: { type: Boolean, default: true },
    gradesOffered: { type: [Number], default: GRADES },
    subjectsOffered: { type: [String], default: SUBJECTS.map(s => s.key) }
  },
  plan: {
    type: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    maxStudents: { type: Number, default: 500 },
    maxTeachers: { type: Number, default: 50 }
  },
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 },
    lastUpdated: Date
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

institutionSchema.index({ code: 1 }, { unique: true });
institutionSchema.index({ 'address.province': 1 });

institutionSchema.methods.updateStats = async function() {
  const User = mongoose.model('User');
  const [studentCount, teacherCount] = await Promise.all([
    User.countDocuments({ institutionId: this._id, role: 'student', isActive: true }),
    User.countDocuments({ institutionId: this._id, role: 'teacher', isActive: true })
  ]);
  this.stats.totalStudents = studentCount;
  this.stats.totalTeachers = teacherCount;
  this.stats.lastUpdated = new Date();
  return this.save();
};

institutionSchema.methods.canAddStudent = function() {
  return this.stats.totalStudents < this.plan.maxStudents;
};

institutionSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase().trim(), isActive: true });
};

module.exports = mongoose.model('Institution', institutionSchema);
