
const { validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');

// Get all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('subjects', 'name code');
    
    res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get teacher by ID
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('subjects', 'name code');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    res.json({
      success: true,
      teacher
    });
  } catch (error) {
    console.error('Get teacher by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get teachers by department
exports.getTeachersByDepartment = async (req, res) => {
  try {
    const teachers = await Teacher.find({ department: req.params.department })
      .populate('subjects', 'name code');
    
    res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    console.error('Get teachers by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get teachers by subject
exports.getTeachersBySubject = async (req, res) => {
  try {
    const teachers = await Teacher.find({ subjects: req.params.subjectId })
      .populate('subjects', 'name code');
    
    res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    console.error('Get teachers by subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create teacher
exports.createTeacher = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, email, phone, department, maxHoursPerDay, subjects } = req.body;

    // Check if teacher exists with the same email
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Create teacher
    const teacher = new Teacher({
      name,
      email,
      phone,
      department,
      maxHoursPerDay: maxHoursPerDay || 6,
      subjects: subjects || []
    });

    await teacher.save();
    
    // Populate subjects for response
    await teacher.populate('subjects', 'name code');
    
    res.status(201).json({
      success: true,
      teacher
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    // Find teacher by ID
    let teacher = await Teacher.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    const { email } = req.body;
    
    // Check if email is being updated and would create a duplicate
    if (email && email !== teacher.email) {
      const existingTeacher = await Teacher.findOne({ email });
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Teacher with this email already exists'
        });
      }
    }
    
    // Update teacher
    teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('subjects', 'name code');
    
    res.json({
      success: true,
      teacher
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    await teacher.deleteOne();
    
    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add subject to teacher
exports.addSubjectToTeacher = async (req, res) => {
  try {
    const { subjectId } = req.body;
    
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID is required'
      });
    }
    
    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Find teacher by ID
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Check if subject is already assigned to the teacher
    if (teacher.subjects.includes(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'Subject is already assigned to this teacher'
      });
    }
    
    // Add subject to teacher
    teacher.subjects.push(subjectId);
    await teacher.save();
    
    // Populate subjects for response
    await teacher.populate('subjects', 'name code');
    
    res.json({
      success: true,
      message: 'Subject added to teacher successfully',
      teacher
    });
  } catch (error) {
    console.error('Add subject to teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove subject from teacher
exports.removeSubjectFromTeacher = async (req, res) => {
  try {
    const { id, subjectId } = req.params;
    
    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Find teacher by ID
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Check if subject is assigned to the teacher
    if (!teacher.subjects.includes(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'Subject is not assigned to this teacher'
      });
    }
    
    // Remove subject from teacher
    teacher.subjects = teacher.subjects.filter(
      subject => subject.toString() !== subjectId
    );
    
    await teacher.save();
    
    // Populate subjects for response
    await teacher.populate('subjects', 'name code');
    
    res.json({
      success: true,
      message: 'Subject removed from teacher successfully',
      teacher
    });
  } catch (error) {
    console.error('Remove subject from teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update teacher unavailability
exports.updateTeacherUnavailability = async (req, res) => {
  try {
    const { unavailableDays, unavailableSlots } = req.body;
    
    // Find teacher by ID
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Update unavailable days if provided
    if (unavailableDays) {
      teacher.unavailableDays = unavailableDays;
    }
    
    // Update unavailable slots if provided
    if (unavailableSlots) {
      teacher.unavailableSlots = unavailableSlots;
    }
    
    await teacher.save();
    
    res.json({
      success: true,
      message: 'Teacher unavailability updated successfully',
      teacher
    });
  } catch (error) {
    console.error('Update teacher unavailability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
