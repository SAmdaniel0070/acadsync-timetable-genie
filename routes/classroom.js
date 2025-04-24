
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classroomController = require('../controllers/classroomController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all classrooms
router.get('/', authenticate, classroomController.getAllClassrooms);

// Get classroom by ID
router.get('/:id', authenticate, classroomController.getClassroomById);

// Get labs only
router.get('/type/labs', authenticate, classroomController.getLabs);

// Get regular classrooms only
router.get('/type/regular', authenticate, classroomController.getRegularClassrooms);

// Create classroom (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').not().isEmpty().withMessage('Classroom name is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1')
  ],
  classroomController.createClassroom
);

// Update classroom (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  classroomController.updateClassroom
);

// Delete classroom (admin only)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  classroomController.deleteClassroom
);

module.exports = router;
