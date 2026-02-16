/**
 * User Model - Siyakha Educational App
 * Aligned with frontend signup form
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// South African Provinces
const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
];

// User Roles
const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  HOD: 'hod',
  PRINCIPAL: 'principal'
};

const userSchema = new mongoose.Schema({
  // ============================================
  // REQUIRED SIGNUP FIELDS
  // ============================================
  
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: [true, 'Please select your role'],
    default: USER_ROLES.STUDENT
  },
  grade: {
    type: Number,
    enum: [10, 11, 12],
    required: function() { return this.role === 'student'; }
  },

  // ============================================
  // INSTITUTION / SCHOOL
  // ============================================
  
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  joinedVia: {
    type: String,
    enum: ['school_code', 'independent', 'invitation'],
    default: 'independent'
  },
  schoolCodeUsed: {
    type: String,
    default: null
  },

  // ============================================
  // PROFILE FIELDS (Optional)
  // ============================================
  
  displayName: String,
  avatarUrl: { type: String, default: null },
  dateOfBirth: { type: Date, default: null },
  address: {
    street: String,
    city: String,
    province: { type: String, enum: PROVINCES },
    postalCode: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  studentId: { type: String, default: null },

  // ============================================
  // ROLE-SPECIFIC PROFILES
  // ============================================
  
  studentProfile: {
    subjects: [String],
    academicYear: { type: Number, default: () => new Date().getFullYear() },
    guardianName: String,
    guardianPhone: String,
    guardianEmail: String
  },
  teacherProfile: {
    assignments: [{
      subjectKey: String,
      subjectLabel: String,
      grades: [Number]
    }],
    employeeId: String,
    department: String,
    qualifications: [String]
  },
  adminProfile: {
    permissions: [{
      type: String,
      enum: ['manage_teachers', 'manage_students', 'manage_resources', 'view_analytics', 'post_announcements', 'manage_institution', 'manage_quizzes']
    }],
    adminLevel: { type: String, enum: ['standard', 'senior', 'super'], default: 'standard' }
  },

  // ============================================
  // PREFERENCES & STATUS
  // ============================================
  
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    notifications: {
      announcements: { type: Boolean, default: true },
      quizReminders: { type: Boolean, default: true },
      resourceUpdates: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLoginAt: Date,
  loginCount: { type: Number, default: 0 },
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['ios', 'android', 'web'] },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ institutionId: 1, role: 1 });
userSchema.index({ institutionId: 1, grade: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ studentId: 1 });

// Pre-save: Generate display name
userSchema.pre('save', function(next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.displayName = `${this.firstName} ${this.lastName.charAt(0)}.`;
  }
  next();
});

// Pre-save: Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) { next(error); }
});

// Pre-save: Generate student ID
userSchema.pre('save', async function(next) {
  if (this.isNew && this.role === 'student' && !this.studentId) {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.studentId = `STU${year}${random}`;
  }
  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.__v;
  return obj;
};

userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'principal') return true;
  if (this.role === 'admin' || this.role === 'hod') {
    return this.adminProfile?.permissions?.includes(permission) || false;
  }
  return false;
};

userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Statics
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.statics.findStudentsByGrade = function(institutionId, grade) {
  return this.find({ institutionId, role: 'student', grade, isActive: true }).sort({ lastName: 1 });
};

userSchema.statics.findTeachers = function(institutionId) {
  return this.find({ institutionId, role: 'teacher', isActive: true }).sort({ lastName: 1 });
};

module.exports = mongoose.model('User', userSchema);
