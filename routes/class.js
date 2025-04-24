
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/classController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all classes
router.get('/', authenticate, classController.getAllClasses);

// Get class by ID
router.get('/:id', authenticate, classController.getClassById);

// Get classes by year
router.get('/year/:yearId', authenticate, classController.getClassesByYear);

// Create class (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').not().isEmpty().withMessage('Class name is required'),
    body('year').not().isEmpty().withMessage('Year ID is required'),
    body('section').not().isEmpty().withMessage('Section is required')
  ],
  classController.createClass
);

// Update class (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  classController.updateClass
);

// Delete class (admin only)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  classController.deleteClass
);

module.exports = router;
