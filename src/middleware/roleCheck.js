/**
 * Role-Based Access Control Middleware
 */

const { USER_ROLES } = require('../config/constants');

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (!allowedRoles.flat().includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Permission denied' });
  }
  next();
};

const requireStudent = requireRole(USER_ROLES.STUDENT);
const requireTeacher = requireRole(USER_ROLES.TEACHER);
const requireTeacherOrAdmin = requireRole(USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.PRINCIPAL);
const requireAdmin = requireRole(USER_ROLES.ADMIN, USER_ROLES.HOD, USER_ROLES.PRINCIPAL);

module.exports = { requireRole, requireStudent, requireTeacher, requireTeacherOrAdmin, requireAdmin };
