
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const teacherController = require('../controllers/teacherController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all teachers
router.get('/', authenticate, teacherController.getAllTeachers);

// Get teacher by ID
router.get('/:id', authenticate, teacherController.getTeacherById);

// Get teachers by department
router.get('/department/:department', authenticate, teacherController.getTeachersByDepartment);

// Get teachers by subject
router.get('/subject/:subjectId', authenticate, teacherController.getTeachersBySubject);

// Create teacher (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').not().isEmpty().withMessage('Teacher name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('department').not().isEmpty().withMessage('Department is required')
  ],
  teacherController.createTeacher
);

// Update teacher (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  teacherController.updateTeacher
);

// Delete teacher (admin only)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  teacherController.deleteTeacher
);

// Add subject to teacher
router.post(
  '/:id/subjects',
  authenticate,
  isAdmin,
  teacherController.addSubjectToTeacher
);

// Remove subject from teacher
router.delete(
  '/:id/subjects/:subjectId',
  authenticate,
  isAdmin,
  teacherController.removeSubjectFromTeacher
);

// Update teacher unavailability
router.put(
  '/:id/unavailability',
  authenticate,
  isAdmin,
  teacherController.updateTeacherUnavailability
);

module.exports = router;
