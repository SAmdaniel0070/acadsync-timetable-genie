
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

// User registration
router.post(
  '/register',
  [
    body('username').not().isEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  authController.register
);

// User login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  authController.login
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Admin route to get all users
router.get('/users', authenticate, isAdmin, authController.getAllUsers);

module.exports = router;
