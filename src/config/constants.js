/**
 * Application Constants
 */

const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  HOD: 'hod',
  PRINCIPAL: 'principal',
  SECRETARY: 'secretary'
};

const GRADES = [10, 11, 12];

const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'physics', label: 'Physics' },
  { key: 'life-sciences', label: 'Life Sciences' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'economics', label: 'Economics' },
  { key: 'english', label: 'English' },
  { key: 'afrikaans', label: 'Afrikaans' },
  { key: 'history', label: 'History' },
  { key: 'geography', label: 'Geography' }
];

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
];

const RESOURCE_CATEGORIES = [
  'past-papers', 'textbooks', 'subject-summaries', 'worksheets',
  'study-guides', 'university-application'
];

const QUIZ_MODES = { PRACTICE: 'practice', TEST: 'test' };

const QUESTION_TYPES = [
  'multiple_choice', 'true_false', 'fill_in_the_blank',
  'select_multiple_answers', 'matching', 'short_answer'
];

module.exports = {
  USER_ROLES, GRADES, SUBJECTS, PROVINCES,
  RESOURCE_CATEGORIES, QUIZ_MODES, QUESTION_TYPES
};
