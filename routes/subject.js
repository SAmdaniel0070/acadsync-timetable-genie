
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subjectController = require('../controllers/subjectController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all subjects
router.get('/', authenticate, subjectController.getAllSubjects);

// Get subject by ID
router.get('/:id', authenticate, subjectController.getSubjectById);

// Get subjects by year
router.get('/year/:yearId', authenticate, subjectController.getSubjectsByYear);

// Get subjects by class
router.get('/class/:classId', authenticate, subjectController.getSubjectsByClass);

// Get subjects by teacher
router.get('/teacher/:teacherId', authenticate, subjectController.getSubjectsByTeacher);

// Create subject (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').not().isEmpty().withMessage('Subject name is required'),
    body('code').not().isEmpty().withMessage('Subject code is required'),
    body('year').not().isEmpty().withMessage('Year ID is required'),
    body('creditHours').isInt({ min: 1 }).withMessage('Credit hours must be at least 1'),
    body('periodsPerWeek').isInt({ min: 1 }).withMessage('Periods per week must be at least 1')
  ],
  subjectController.createSubject
);

// Update subject (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  subjectController.updateSubject
);

// Delete subject (admin only)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  subjectController.deleteSubject
);

module.exports = router;
