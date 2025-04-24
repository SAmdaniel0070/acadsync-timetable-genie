
const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all timetables
router.get('/', authenticate, timetableController.getAllTimetables);

// Get active timetable
router.get('/active', authenticate, timetableController.getActiveTimetable);

// Get timetable by ID
router.get('/:id', authenticate, timetableController.getTimetableById);

// Generate new timetable (admin only)
router.post('/generate', authenticate, isAdmin, timetableController.generateTimetable);

// Update timetable lesson (admin only)
router.put('/:id/lessons/:lessonId', authenticate, isAdmin, timetableController.updateLesson);

// Add lesson to timetable (admin only)
router.post('/:id/lessons', authenticate, isAdmin, timetableController.addLesson);

// Remove lesson from timetable (admin only)
router.delete('/:id/lessons/:lessonId', authenticate, isAdmin, timetableController.removeLesson);

// Set timetable as active (admin only)
router.put('/:id/set-active', authenticate, isAdmin, timetableController.setActiveTimetable);

// Lock/unlock timetable (admin only)
router.put('/:id/toggle-lock', authenticate, isAdmin, timetableController.toggleLockTimetable);

// Get master timetable
router.get('/:id/master', authenticate, timetableController.getMasterTimetable);

// Get year-wise timetable
router.get('/:id/year/:yearId', authenticate, timetableController.getYearTimetable);

// Get class-wise timetable
router.get('/:id/class/:classId', authenticate, timetableController.getClassTimetable);

// Get teacher-wise timetable
router.get('/:id/teacher/:teacherId', authenticate, timetableController.getTeacherTimetable);

// Get classroom-wise timetable
router.get('/:id/classroom/:classroomId', authenticate, timetableController.getClassroomTimetable);

module.exports = router;
