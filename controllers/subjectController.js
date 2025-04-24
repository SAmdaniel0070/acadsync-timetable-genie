
const { validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

// Get all subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('year', 'name value')
      .populate('classes', 'name section')
      .populate('preferredClassrooms', 'name capacity isLab');
    
    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get subject by ID
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('year', 'name value')
      .populate('classes', 'name section')
      .populate('preferredClassrooms', 'name capacity isLab');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.json({
      success: true,
      subject
    });
  } catch (error) {
    console.error('Get subject by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get subjects by year
exports.getSubjectsByYear = async (req, res) => {
  try {
    const subjects = await Subject.find({ year: req.params.yearId })
      .populate('year', 'name value')
      .populate('classes', 'name section')
      .populate('preferredClassrooms', 'name capacity isLab');
    
    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    console.error('Get subjects by year error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get subjects by class
exports.getSubjectsByClass = async (req, res) => {
  try {
    const subjects = await Subject.find({ classes: req.params.classId })
      .populate('year', 'name value')
      .populate('classes', 'name section')
      .populate('preferredClassrooms', 'name capacity isLab');
    
    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    console.error('Get subjects by class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get subjects by teacher
exports.getSubjectsByTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    const subjects = await Subject.find({ _id: { $in: teacher.subjects } })
      .populate('year', 'name value')
      .populate('classes', 'name section')
      .populate('preferredClassrooms', 'name capacity isLab');
    
    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    console.error('Get subjects by teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create subject
exports.createSubject = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const {
      name,
      code,
      year,
      classes,
      isLab,
      creditHours,
      periodsPerWeek,
      periodsPerDay,
      preferredClassrooms
    } = req.body;

    // Check if subject exists with the same code
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this code already exists'
      });
    }

    // Validate classes
    if (classes && classes.length > 0) {
      const classCount = await Class.countDocuments({ _id: { $in: classes } });
      if (classCount !== classes.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more classes were not found'
        });
      }
    }

    // Create subject
    const subject = new Subject({
      name,
      code,
      year,
      classes: classes || [],
      isLab: isLab || false,
      creditHours,
      periodsPerWeek,
      periodsPerDay: periodsPerDay || 1,
      preferredClassrooms: preferredClassrooms || []
    });

    await subject.save();
    
    // Populate for response
    await subject.populate('year', 'name value');
    await subject.populate('classes', 'name section');
    await subject.populate('preferredClassrooms', 'name capacity isLab');
    
    res.status(201).json({
      success: true,
      subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update subject
exports.updateSubject = async (req, res) => {
  try {
    // Find subject by ID
    let subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    const { code, classes } = req.body;
    
    // Check if code is being updated and would create a duplicate
    if (code && code !== subject.code) {
      const existingSubject = await Subject.findOne({ code });
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject with this code already exists'
        });
      }
    }
    
    // Validate classes
    if (classes && classes.length > 0) {
      const classCount = await Class.countDocuments({ _id: { $in: classes } });
      if (classCount !== classes.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more classes were not found'
        });
      }
    }
    
    // Update subject
    subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    .populate('year', 'name value')
    .populate('classes', 'name section')
    .populate('preferredClassrooms', 'name capacity isLab');
    
    res.json({
      success: true,
      subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete subject
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Remove subject reference from teachers
    await Teacher.updateMany(
      { subjects: subject._id },
      { $pull: { subjects: subject._id } }
    );
    
    await subject.deleteOne();
    
    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
