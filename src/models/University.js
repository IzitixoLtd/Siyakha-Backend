/**
 * University Model
 */

const mongoose = require('mongoose');
const { PROVINCES } = require('../config/constants');

const universitySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  shortName: String,
  logoUrl: String,
  website: String,
  applicationPortal: String,
  location: {
    province: { type: String, enum: PROVINCES },
    city: String
  },
  faculties: [{
    key: String,
    name: String,
    description: String,
    courses: [{
      name: String,
      code: String,
      duration: String,
      qualification: String,
      apsScore: Number,
      requirements: [{ subject: String, minimumLevel: Number, minimumPercentage: Number }],
      careerPaths: [String],
      isPopular: Boolean
    }]
  }],
  applicationInfo: {
    openingDate: Date,
    closingDate: Date,
    lateClosingDate: Date,
    applicationFee: Number,
    requiredDocuments: [String],
    process: [String]
  },
  financialAid: {
    nsfasAccredited: Boolean,
    bursariesAvailable: Boolean
  },
  applicationTips: [String],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, { timestamps: true });

universitySchema.index({ key: 1 }, { unique: true });
universitySchema.index({ 'location.province': 1 });

universitySchema.methods.getAllCourses = function() {
  const courses = [];
  for (const faculty of this.faculties) {
    for (const course of faculty.courses) {
      courses.push({ ...course.toObject(), facultyKey: faculty.key, facultyName: faculty.name });
    }
  }
  return courses;
};

universitySchema.methods.searchCourses = function(query) {
  const term = query.toLowerCase();
  const results = [];
  for (const faculty of this.faculties) {
    for (const course of faculty.courses) {
      if (course.name.toLowerCase().includes(term) || course.careerPaths?.some(c => c.toLowerCase().includes(term))) {
        results.push({ ...course.toObject(), facultyKey: faculty.key, facultyName: faculty.name });
      }
    }
  }
  return results;
};

universitySchema.statics.getAllSummaries = function() {
  return this.find({ isActive: true }).select('key name shortName logoUrl location.province location.city').sort({ name: 1 });
};

module.exports = mongoose.model('University', universitySchema);
