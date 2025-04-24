
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const yearController = require('../controllers/yearController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all years
router.get('/', authenticate, yearController.getAllYears);

// Get year by ID
router.get('/:id', authenticate, yearController.getYearById);

// Create year (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').not().isEmpty().withMessage('Year name is required'),
    body('value').isInt({ min: 1, max: 5 }).withMessage('Year value must be between 1 and 5')
  ],
  yearController.createYear
);

// Update year (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  yearController.updateYear
);

// Delete year (admin only)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  yearController.deleteYear
);

module.exports = router;
