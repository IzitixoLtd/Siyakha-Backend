/**
 * Authentication Controller
 * Handles user registration (signup), login, and token management
 */

const User = require('../models/User');
const Institution = require('../models/Institution');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/apiResponse');
const { generateTokens } = require('../utils/helpers');

/**
 * Register new user (with or without school code)
 * POST /api/auth/register
 * 
 * Required fields: firstName, lastName, email, password, phoneNumber, role, grade (if student)
 * Optional: schoolCode (to join an institution)
 */
const register = asyncHandler(async (req, res) => {
  const { 
    firstName, 
    lastName, 
    email, 
    password, 
    phoneNumber, 
    role, 
    grade,
    schoolCode,
    // Optional fields
    subjects,
    teacherAssignments,
    dateOfBirth,
    city,
    province
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !phoneNumber || !role) {
    return response.badRequest(res, 'Please fill in all required fields', [
      !firstName && { field: 'firstName', message: 'First name is required' },
      !lastName && { field: 'lastName', message: 'Last name is required' },
      !email && { field: 'email', message: 'Email is required' },
      !password && { field: 'password', message: 'Password is required' },
      !phoneNumber && { field: 'phoneNumber', message: 'Phone number is required' },
      !role && { field: 'role', message: 'Please select your role' }
    ].filter(Boolean));
  }

  // Validate role
  const validRoles = ['student', 'teacher', 'admin'];
  if (!validRoles.includes(role)) {
    return response.badRequest(res, 'Invalid role selected');
  }

  // Students must provide grade
  if (role === 'student' && !grade) {
    return response.badRequest(res, 'Grade is required for students', [
      { field: 'grade', message: 'Please select your grade' }
    ]);
  }

  // Validate grade value
  if (grade && ![10, 11, 12].includes(Number(grade))) {
    return response.badRequest(res, 'Grade must be 10, 11, or 12');
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return response.conflict(res, 'An account with this email already exists');
  }

  // Handle school code if provided
  let institution = null;
  let joinedVia = 'independent';

  if (schoolCode && schoolCode.trim()) {
    institution = await Institution.findOne({ 
      code: schoolCode.toUpperCase().trim(), 
      isActive: true 
    });
    
    if (!institution) {
      return response.badRequest(res, 'Invalid school code. Please check and try again.', [
        { field: 'schoolCode', message: 'School code not found' }
      ]);
    }

    // Check if institution allows self-registration for this role
    if (role === 'student' && !institution.settings?.allowStudentSelfRegistration) {
      return response.forbidden(res, 'This school does not allow student self-registration. Please contact your school administrator.');
    }
    if (role === 'teacher' && !institution.settings?.allowTeacherSelfRegistration) {
      return response.forbidden(res, 'This school does not allow teacher self-registration. Please contact your school administrator.');
    }

    joinedVia = 'school_code';
  }

  // Create user object
  const userData = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password, // Will be hashed by pre-save hook
    phoneNumber: phoneNumber.trim(),
    role,
    grade: role === 'student' ? Number(grade) : undefined,
    institutionId: institution?._id || null,
    joinedVia,
    schoolCodeUsed: schoolCode?.toUpperCase().trim() || null
  };

  // Add optional profile fields
  if (dateOfBirth) {
    userData.dateOfBirth = new Date(dateOfBirth);
  }

  if (city || province) {
    userData.address = {
      city: city?.trim(),
      province: province
    };
  }

  // Add role-specific profile data
  if (role === 'student' && subjects) {
    userData.studentProfile = {
      subjects: Array.isArray(subjects) ? subjects : [subjects],
      academicYear: new Date().getFullYear()
    };
  }

  if (role === 'teacher' && teacherAssignments) {
    userData.teacherProfile = {
      assignments: teacherAssignments
    };
  }

  if (role === 'admin') {
    userData.adminProfile = {
      permissions: ['view_analytics', 'post_announcements'],
      adminLevel: 'standard'
    };
  }

  // Create the user
  const user = new User(userData);
  await user.save();

  // Update institution stats if user joined a school
  if (institution) {
    await institution.updateStats();
  }

  // Generate auth tokens
  const tokens = generateTokens(user._id);

  // Update last login
  user.lastLoginAt = new Date();
  user.loginCount = 1;
  await user.save();

  // Prepare response
  const responseData = {
    user: user.toPublicJSON(),
    ...tokens
  };

  // Include institution info if user joined a school
  if (institution) {
    responseData.institution = {
      id: institution._id,
      name: institution.name,
      shortName: institution.shortName,
      code: institution.code
    };
  }

  return response.created(res, responseData, 'Account created successfully! Welcome to Siyakha.');
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return response.badRequest(res, 'Please enter your email and password');
  }

  // Find user with password field
  const user = await User.findOne({ 
    email: email.toLowerCase().trim(), 
    isActive: true 
  }).select('+passwordHash');

  if (!user) {
    return response.unauthorized(res, 'Invalid email or password');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return response.unauthorized(res, 'Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens(user._id);

  // Update login info
  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save();

  // Get institution if user belongs to one
  let institution = null;
  if (user.institutionId) {
    institution = await Institution.findById(user.institutionId)
      .select('name shortName code');
  }

  return response.success(res, {
    user: user.toPublicJSON(),
    institution,
    ...tokens
  }, 'Login successful');
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const tokens = generateTokens(req.user._id);
  return response.success(res, tokens, 'Token refreshed');
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  
  if (!user) {
    return response.notFound(res, 'User not found');
  }

  let institution = null;
  if (user.institutionId) {
    institution = await Institution.findById(user.institutionId)
      .select('name shortName code settings');
  }

  return response.success(res, {
    user: user.toPublicJSON(),
    institution
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    bio,
    address,
    avatarUrl,
    subjects,
    preferences
  } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return response.notFound(res, 'User not found');
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName.trim();
  if (lastName) user.lastName = lastName.trim();
  if (phoneNumber) user.phoneNumber = phoneNumber.trim();
  if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (address) user.address = { ...user.address, ...address };
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  // Update student subjects
  if (subjects && user.role === 'student') {
    user.studentProfile = {
      ...user.studentProfile,
      subjects: Array.isArray(subjects) ? subjects : [subjects]
    };
  }

  await user.save();

  return response.success(res, user.toPublicJSON(), 'Profile updated successfully');
});

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return response.badRequest(res, 'Please provide current and new password');
  }

  if (newPassword.length < 6) {
    return response.badRequest(res, 'New password must be at least 6 characters');
  }

  const user = await User.findById(req.userId).select('+passwordHash');
  if (!user) {
    return response.notFound(res, 'User not found');
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return response.badRequest(res, 'Current password is incorrect');
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  // Generate new tokens
  const tokens = generateTokens(user._id);

  return response.success(res, tokens, 'Password changed successfully');
});

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // In a full implementation, you would blacklist the token here
  return response.success(res, null, 'Logged out successfully');
});

/**
 * Verify school code (check if valid without registering)
 * POST /api/auth/verify-school-code
 */
const verifySchoolCode = asyncHandler(async (req, res) => {
  const { schoolCode } = req.body;

  if (!schoolCode) {
    return response.badRequest(res, 'School code is required');
  }

  const institution = await Institution.findOne({
    code: schoolCode.toUpperCase().trim(),
    isActive: true
  }).select('name shortName code settings.allowStudentSelfRegistration settings.allowTeacherSelfRegistration');

  if (!institution) {
    return response.notFound(res, 'School code not found');
  }

  return response.success(res, {
    valid: true,
    school: {
      name: institution.name,
      shortName: institution.shortName,
      code: institution.code,
      allowStudentRegistration: institution.settings?.allowStudentSelfRegistration ?? true,
      allowTeacherRegistration: institution.settings?.allowTeacherSelfRegistration ?? false
    }
  }, 'School code verified');
});

module.exports = { 
  register, 
  login, 
  refreshToken, 
  getMe, 
  updateProfile,
  changePassword,
  logout,
  verifySchoolCode
};
