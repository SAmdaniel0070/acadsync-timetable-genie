
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const timingController = require('../controllers/timingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all timings
router.get('/', authenticate, timingController.getAllTimings);

// Get active timing
router.get('/active', authenticate, timingController.getActiveTiming);

// Get timing by ID
router.get('/:id', authenticate, timingController.getTimingById);

// Create timing (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('academicYear').not().isEmpty().withMessage('Academic year is required'),
    body('periodsPerDay').isInt({ min: 1 }).withMessage('Periods per day must be at least 1'),
    body('workingDays').isArray().withMessage('Working days must be an array')
  ],
  timingController.createTiming
);

// Update timing (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  timingController.updateTiming
);

// Delete timing (admin only)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  timingController.deleteTiming
);

// Set active timing (admin only)
router.put(
  '/:id/set-active',
  authenticate,
  isAdmin,
  timingController.setActiveTiming
);

// Add time slot to timing (admin only)
router.post(
  '/:id/time-slots',
  authenticate,
  isAdmin,
  [
    body('name').not().isEmpty().withMessage('Time slot name is required'),
    body('startTime').not().isEmpty().withMessage('Start time is required'),
    body('endTime').not().isEmpty().withMessage('End time is required'),
    body('order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
  ],
  timingController.addTimeSlotToTiming
);

// Remove time slot from timing (admin only)
router.delete(
  '/:id/time-slots/:slotId',
  authenticate,
  isAdmin,
  timingController.removeTimeSlotFromTiming
);

module.exports = router;
