
const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Timing = require('../models/Timing');
const TimeSlot = require('../models/TimeSlot');
const Classroom = require('../models/Classroom');
const Year = require('../models/Year');
const timetableGenerator = require('../utils/timetableGenerator');

// Get all timetables
exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .select('-lessons')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    console.error('Get all timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get active timetable
exports.getActiveTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ isActive: true });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No active timetable found'
      });
    }
    
    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    console.error('Get active timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get timetable by ID
exports.getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate({
        path: 'lessons.classId',
        select: 'name section'
      })
      .populate({
        path: 'lessons.subjectId',
        select: 'name code isLab'
      })
      .populate({
        path: 'lessons.teacherId',
        select: 'name'
      })
      .populate({
        path: 'lessons.timeSlotId',
        select: 'name startTime endTime'
      })
      .populate({
        path: 'lessons.classroomId',
        select: 'name capacity isLab'
      });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    console.error('Get timetable by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Generate new timetable
exports.generateTimetable = async (req, res) => {
  try {
    const { name, academicYear, yearId, timingId } = req.body;
    
    if (!name || !academicYear || !timingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get timing config
    const timing = await Timing.findById(timingId).populate('timeSlots');
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'Timing configuration not found'
      });
    }
    
    // Get classes, filter by year if provided
    const classQuery = yearId ? { year: yearId } : {};
    const classes = await Class.find(classQuery);
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No classes found'
      });
    }
    
    // Get all subjects for these classes
    const subjects = await Subject.find({
      classes: { $in: classes.map(cls => cls._id) }
    });
    
    if (subjects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subjects found for the selected classes'
      });
    }
    
    // Get all teachers
    const teachers = await Teacher.find({});
    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No teachers found'
      });
    }
    
    // Get all classrooms
    const classrooms = await Classroom.find({});
    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No classrooms found'
      });
    }
    
    // Generate timetable using the algorithm
    const generatedLessons = await timetableGenerator.generateTimetable({
      classes,
      subjects,
      teachers,
      timing,
      classrooms
    });
    
    // Create new timetable document
    const timetable = new Timetable({
      name,
      academicYear,
      year: yearId || undefined,
      timing: timingId,
      lessons: generatedLessons,
      generatedAt: Date.now(),
      modifiedAt: Date.now()
    });
    
    await timetable.save();
    
    res.status(201).json({
      success: true,
      message: 'Timetable generated successfully',
      timetable: {
        id: timetable._id,
        name: timetable.name,
        lessonCount: timetable.lessons.length
      }
    });
  } catch (error) {
    console.error('Generate timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update lesson in timetable
exports.updateLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const { day, timeSlotId, classId, subjectId, teacherId, classroomId, batchId } = req.body;
    
    // Check if timetable exists
    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Check if timetable is locked
    if (timetable.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Timetable is locked and cannot be modified'
      });
    }
    
    // Find the lesson index
    const lessonIndex = timetable.lessons.findIndex(
      lesson => lesson._id.toString() === lessonId
    );
    
    if (lessonIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found in timetable'
      });
    }
    
    // Validate time slot
    if (timeSlotId) {
      const timeSlot = await TimeSlot.findById(timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({
          success: false,
          message: 'Time slot not found'
        });
      }
    }
    
    // Validate class
    if (classId) {
      const cls = await Class.findById(classId);
      if (!cls) {
        return res.status(404).json({
          success: false,
          message: 'Class not found'
        });
      }
    }
    
    // Validate subject
    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }
    }
    
    // Validate teacher
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }
      
      // Check if teacher can teach this subject
      if (subjectId) {
        const canTeach = teacher.subjects.some(
          subject => subject.toString() === subjectId
        );
        
        if (!canTeach) {
          return res.status(400).json({
            success: false,
            message: 'Teacher is not qualified to teach this subject'
          });
        }
      }
    }
    
    // Validate classroom
    if (classroomId) {
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found'
        });
      }
    }
    
    // Update the lesson
    timetable.lessons[lessonIndex] = {
      ...timetable.lessons[lessonIndex],
      day: day !== undefined ? day : timetable.lessons[lessonIndex].day,
      timeSlotId: timeSlotId || timetable.lessons[lessonIndex].timeSlotId,
      classId: classId || timetable.lessons[lessonIndex].classId,
      subjectId: subjectId || timetable.lessons[lessonIndex].subjectId,
      teacherId: teacherId || timetable.lessons[lessonIndex].teacherId,
      classroomId: classroomId,
      batchId: batchId
    };
    
    // Update modified timestamp
    timetable.modifiedAt = Date.now();
    
    await timetable.save();
    
    res.json({
      success: true,
      message: 'Lesson updated successfully',
      lesson: timetable.lessons[lessonIndex]
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add lesson to timetable
exports.addLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, timeSlotId, classId, subjectId, teacherId, classroomId, batchId } = req.body;
    
    // Validate required fields
    if (!day && day !== 0 || !timeSlotId || !classId || !subjectId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if timetable exists
    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Check if timetable is locked
    if (timetable.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Timetable is locked and cannot be modified'
      });
    }
    
    // Validate time slot
    const timeSlot = await TimeSlot.findById(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }
    
    // Validate class
    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Validate teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Check if teacher can teach this subject
    const canTeach = teacher.subjects.some(
      subj => subj.toString() === subjectId
    );
    
    if (!canTeach) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is not qualified to teach this subject'
      });
    }
    
    // Check for conflicts
    const classConflict = timetable.lessons.some(lesson => 
      lesson.classId.toString() === classId && 
      lesson.day === day && 
      lesson.timeSlotId.toString() === timeSlotId
    );
    
    if (classConflict) {
      return res.status(400).json({
        success: false,
        message: 'Class already has a lesson at this time'
      });
    }
    
    const teacherConflict = timetable.lessons.some(lesson => 
      lesson.teacherId.toString() === teacherId && 
      lesson.day === day && 
      lesson.timeSlotId.toString() === timeSlotId
    );
    
    if (teacherConflict) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is already teaching at this time'
      });
    }
    
    // Check classroom conflict if provided
    if (classroomId) {
      const classroomConflict = timetable.lessons.some(lesson => 
        lesson.classroomId && 
        lesson.classroomId.toString() === classroomId && 
        lesson.day === day && 
        lesson.timeSlotId.toString() === timeSlotId
      );
      
      if (classroomConflict) {
        return res.status(400).json({
          success: false,
          message: 'Classroom is already in use at this time'
        });
      }
    }
    
    // Create new lesson
    const newLesson = {
      _id: new mongoose.Types.ObjectId(),
      day,
      timeSlotId,
      classId,
      subjectId,
      teacherId,
      classroomId,
      batchId
    };
    
    // Add the lesson to timetable
    timetable.lessons.push(newLesson);
    
    // Update modified timestamp
    timetable.modifiedAt = Date.now();
    
    await timetable.save();
    
    res.status(201).json({
      success: true,
      message: 'Lesson added successfully',
      lesson: newLesson
    });
  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove lesson from timetable
exports.removeLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    
    // Check if timetable exists
    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Check if timetable is locked
    if (timetable.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Timetable is locked and cannot be modified'
      });
    }
    
    // Find the lesson index
    const lessonIndex = timetable.lessons.findIndex(
      lesson => lesson._id.toString() === lessonId
    );
    
    if (lessonIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found in timetable'
      });
    }
    
    // Remove the lesson
    timetable.lessons.splice(lessonIndex, 1);
    
    // Update modified timestamp
    timetable.modifiedAt = Date.now();
    
    await timetable.save();
    
    res.json({
      success: true,
      message: 'Lesson removed successfully'
    });
  } catch (error) {
    console.error('Remove lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Set timetable as active
exports.setActiveTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if timetable exists
    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Deactivate all other timetables
    await Timetable.updateMany(
      { _id: { $ne: id } },
      { $set: { isActive: false } }
    );
    
    // Activate this timetable
    timetable.isActive = true;
    await timetable.save();
    
    res.json({
      success: true,
      message: 'Timetable activated successfully'
    });
  } catch (error) {
    console.error('Set active timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Lock/unlock timetable
exports.toggleLockTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if timetable exists
    const timetable = await Timetable.findById(id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Toggle lock status
    timetable.isLocked = !timetable.isLocked;
    await timetable.save();
    
    res.json({
      success: true,
      message: `Timetable ${timetable.isLocked ? 'locked' : 'unlocked'} successfully`
    });
  } catch (error) {
    console.error('Toggle lock timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get master timetable
exports.getMasterTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get timetable with populated fields
    const timetable = await Timetable.findById(id)
      .populate({
        path: 'lessons.classId',
        select: 'name section'
      })
      .populate({
        path: 'lessons.subjectId',
        select: 'name code isLab'
      })
      .populate({
        path: 'lessons.teacherId',
        select: 'name'
      })
      .populate({
        path: 'lessons.timeSlotId',
        select: 'name startTime endTime'
      })
      .populate({
        path: 'lessons.classroomId',
        select: 'name capacity isLab'
      })
      .populate({
        path: 'timing',
        select: 'workingDays'
      });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Get all time slots in order
    const timeSlots = await TimeSlot.find({
      _id: { $in: timetable.lessons.map(l => l.timeSlotId) }
    }).sort('order');
    
    // Format timetable data with days as columns and time slots as rows
    const formattedTimetable = timeSlots.map(slot => {
      const row = {
        timeSlot: {
          id: slot._id,
          name: slot.name,
          startTime: slot.startTime,
          endTime: slot.endTime
        },
        days: []
      };
      
      // For each working day, find lessons at this time slot
      for (const day of timetable.timing.workingDays) {
        const dayLessons = timetable.lessons.filter(
          lesson => lesson.day === day && lesson.timeSlotId.toString() === slot._id.toString()
        );
        
        row.days.push({
          day,
          lessons: dayLessons.map(lesson => ({
            id: lesson._id,
            class: lesson.classId,
            subject: lesson.subjectId,
            teacher: lesson.teacherId,
            classroom: lesson.classroomId,
            batch: lesson.batchId
          }))
        });
      }
      
      return row;
    });
    
    res.json({
      success: true,
      timetable: {
        id: timetable._id,
        name: timetable.name,
        academicYear: timetable.academicYear,
        isActive: timetable.isActive,
        isLocked: timetable.isLocked,
        workingDays: timetable.timing.workingDays,
        data: formattedTimetable
      }
    });
  } catch (error) {
    console.error('Get master timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get year-wise timetable
exports.getYearTimetable = async (req, res) => {
  try {
    const { id, yearId } = req.params;
    
    // Validate year
    const year = await Year.findById(yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Year not found'
      });
    }
    
    // Get classes for this year
    const classes = await Class.find({ year: yearId });
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No classes found for this year'
      });
    }
    
    // Get timetable
    const timetable = await Timetable.findById(id)
      .populate({
        path: 'lessons.classId',
        select: 'name section'
      })
      .populate({
        path: 'lessons.subjectId',
        select: 'name code isLab'
      })
      .populate({
        path: 'lessons.teacherId',
        select: 'name'
      })
      .populate({
        path: 'lessons.timeSlotId',
        select: 'name startTime endTime'
      })
      .populate({
        path: 'lessons.classroomId',
        select: 'name capacity isLab'
      })
      .populate({
        path: 'timing',
        select: 'workingDays'
      });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Filter lessons for classes in this year
    const classIds = classes.map(cls => cls._id.toString());
    const filteredLessons = timetable.lessons.filter(
      lesson => classIds.includes(lesson.classId._id.toString())
    );
    
    // Get all time slots in order
    const timeSlots = await TimeSlot.find({
      _id: { $in: filteredLessons.map(l => l.timeSlotId) }
    }).sort('order');
    
    // Format timetable data
    const formattedTimetable = timeSlots.map(slot => {
      const row = {
        timeSlot: {
          id: slot._id,
          name: slot.name,
          startTime: slot.startTime,
          endTime: slot.endTime
        },
        days: []
      };
      
      // For each working day, find lessons at this time slot
      for (const day of timetable.timing.workingDays) {
        const dayLessons = filteredLessons.filter(
          lesson => lesson.day === day && lesson.timeSlotId._id.toString() === slot._id.toString()
        );
        
        row.days.push({
          day,
          lessons: dayLessons.map(lesson => ({
            id: lesson._id,
            class: lesson.classId,
            subject: lesson.subjectId,
            teacher: lesson.teacherId,
            classroom: lesson.classroomId,
            batch: lesson.batchId
          }))
        });
      }
      
      return row;
    });
    
    res.json({
      success: true,
      year,
      timetable: {
        id: timetable._id,
        name: timetable.name,
        academicYear: timetable.academicYear,
        isActive: timetable.isActive,
        isLocked: timetable.isLocked,
        workingDays: timetable.timing.workingDays,
        data: formattedTimetable
      }
    });
  } catch (error) {
    console.error('Get year timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get class-wise timetable
exports.getClassTimetable = async (req, res) => {
  try {
    const { id, classId } = req.params;
    
    // Validate class
    const cls = await Class.findById(classId).populate('year', 'name value');
    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Get timetable
    const timetable = await Timetable.findById(id)
      .populate({
        path: 'lessons.subjectId',
        select: 'name code isLab'
      })
      .populate({
        path: 'lessons.teacherId',
        select: 'name'
      })
      .populate({
        path: 'lessons.timeSlotId',
        select: 'name startTime endTime order'
      })
      .populate({
        path: 'lessons.classroomId',
        select: 'name capacity isLab'
      })
      .populate({
        path: 'lessons.batchId',
        select: 'name'
      })
      .populate({
        path: 'timing',
        select: 'workingDays'
      });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Filter lessons for this class
    const filteredLessons = timetable.lessons.filter(
      lesson => lesson.classId.toString() === classId
    );
    
    // Get all time slots for this timetable
    const timeSlotIds = [...new Set(filteredLessons.map(l => l.timeSlotId._id.toString()))];
    const timeSlots = await TimeSlot.find({ _id: { $in: timeSlotIds } }).sort('order');
    
    // Format class timetable as a 2D grid: days x time slots
    const formattedTimetable = {
      days: []
    };
    
    // For each working day
    for (const day of timetable.timing.workingDays) {
      const dayData = {
        day,
        timeSlots: []
      };
      
      // For each time slot
      for (const slot of timeSlots) {
        const lesson = filteredLessons.find(
          l => l.day === day && l.timeSlotId._id.toString() === slot._id.toString()
        );
        
        dayData.timeSlots.push({
          timeSlot: {
            id: slot._id,
            name: slot.name,
            startTime: slot.startTime,
            endTime: slot.endTime
          },
          lesson: lesson ? {
            id: lesson._id,
            subject: lesson.subjectId,
            teacher: lesson.teacherId,
            classroom: lesson.classroomId,
            batch: lesson.batchId
          } : null
        });
      }
      
      formattedTimetable.days.push(dayData);
    }
    
    res.json({
      success: true,
      class: cls,
      timetable: {
        id: timetable._id,
        name: timetable.name,
        academicYear: timetable.academicYear,
        isActive: timetable.isActive,
        isLocked: timetable.isLocked,
        workingDays: timetable.timing.workingDays,
        data: formattedTimetable
      }
    });
  } catch (error) {
    console.error('Get class timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get teacher-wise timetable
exports.getTeacherTimetable = async (req, res) => {
  try {
    const { id, teacherId } = req.params;
    
    // Validate teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Get timetable
    const timetable = await Timetable.findById(id)
      .populate({
        path: 'lessons.classId',
        select: 'name section'
      })
      .populate({
        path: 'lessons.subjectId',
        select: 'name code isLab'
      })
      .populate({
        path: 'lessons.timeSlotId',
        select: 'name startTime endTime order'
      })
      .populate({
        path: 'lessons.classroomId',
        select: 'name capacity isLab'
      })
      .populate({
        path: 'lessons.batchId',
        select: 'name'
      })
      .populate({
        path: 'timing',
        select: 'workingDays'
      });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Filter lessons for this teacher
    const filteredLessons = timetable.lessons.filter(
      lesson => lesson.teacherId.toString() === teacherId
    );
    
    // Get all time slots for this timetable
    const timeSlotIds = await TimeSlot.find().sort('order');
    
    // Format teacher timetable as a 2D grid: days x time slots
    const formattedTimetable = {
      days: []
    };
    
    // For each working day
    for (const day of timetable.timing.workingDays) {
      const dayData = {
        day,
        timeSlots: []
      };
      
      // For each time slot
      for (const slot of timeSlotIds) {
        const lesson = filteredLessons.find(
          l => l.day === day && l.timeSlotId._id.toString() === slot._id.toString()
        );
        
        dayData.timeSlots.push({
          timeSlot: {
            id: slot._id,
            name: slot.name,
            startTime: slot.startTime,
            endTime: slot.endTime
          },
          lesson: lesson ? {
            id: lesson._id,
            class: lesson.classId,
            subject: lesson.subjectId,
            classroom: lesson.classroomId,
            batch: lesson.batchId
          } : null
        });
      }
      
      formattedTimetable.days.push(dayData);
    }
    
    res.json({
      success: true,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        department: teacher.department
      },
      timetable: {
        id: timetable._id,
        name: timetable.name,
        academicYear: timetable.academicYear,
        isActive: timetable.isActive,
        isLocked: timetable.isLocked,
        workingDays: timetable.timing.workingDays,
        data: formattedTimetable
      }
    });
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get classroom-wise timetable
exports.getClassroomTimetable = async (req, res) => {
  try {
    const { id, classroomId } = req.params;
    
    // Validate classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    // Get timetable
    const timetable = await Timetable.findById(id)
      .populate({
        path: 'lessons.classId',
        select: 'name section'
      })
      .populate({
        path: 'lessons.subjectId',
        select: 'name code isLab'
      })
      .populate({
        path: 'lessons.teacherId',
        select: 'name'
      })
      .populate({
        path: 'lessons.timeSlotId',
        select: 'name startTime endTime order'
      })
      .populate({
        path: 'lessons.batchId',
        select: 'name'
      })
      .populate({
        path: 'timing',
        select: 'workingDays'
      });
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    // Filter lessons for this classroom
    const filteredLessons = timetable.lessons.filter(
      lesson => lesson.classroomId && lesson.classroomId.toString() === classroomId
    );
    
    // Get all time slots for this timetable
    const timeSlotIds = await TimeSlot.find().sort('order');
    
    // Format classroom timetable as a 2D grid: days x time slots
    const formattedTimetable = {
      days: []
    };
    
    // For each working day
    for (const day of timetable.timing.workingDays) {
      const dayData = {
        day,
        timeSlots: []
      };
      
      // For each time slot
      for (const slot of timeSlotIds) {
        const lesson = filteredLessons.find(
          l => l.day === day && l.timeSlotId._id.toString() === slot._id.toString()
        );
        
        dayData.timeSlots.push({
          timeSlot: {
            id: slot._id,
            name: slot.name,
            startTime: slot.startTime,
            endTime: slot.endTime
          },
          lesson: lesson ? {
            id: lesson._id,
            class: lesson.classId,
            subject: lesson.subjectId,
            teacher: lesson.teacherId,
            batch: lesson.batchId
          } : null
        });
      }
      
      formattedTimetable.days.push(dayData);
    }
    
    res.json({
      success: true,
      classroom: {
        id: classroom._id,
        name: classroom.name,
        capacity: classroom.capacity,
        isLab: classroom.isLab
      },
      timetable: {
        id: timetable._id,
        name: timetable.name,
        academicYear: timetable.academicYear,
        isActive: timetable.isActive,
        isLocked: timetable.isLocked,
        workingDays: timetable.timing.workingDays,
        data: formattedTimetable
      }
    });
  } catch (error) {
    console.error('Get classroom timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
