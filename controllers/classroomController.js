
const { validationResult } = require('express-validator');
const Classroom = require('../models/Classroom');

// Get all classrooms
exports.getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort('name');
    
    res.json({
      success: true,
      count: classrooms.length,
      classrooms
    });
  } catch (error) {
    console.error('Get all classrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get classroom by ID
exports.getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    res.json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Get classroom by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get labs only
exports.getLabs = async (req, res) => {
  try {
    const labs = await Classroom.find({ isLab: true }).sort('name');
    
    res.json({
      success: true,
      count: labs.length,
      classrooms: labs
    });
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get regular classrooms only
exports.getRegularClassrooms = async (req, res) => {
  try {
    const regularClassrooms = await Classroom.find({ isLab: false }).sort('name');
    
    res.json({
      success: true,
      count: regularClassrooms.length,
      classrooms: regularClassrooms
    });
  } catch (error) {
    console.error('Get regular classrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create classroom
exports.createClassroom = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, capacity, isLab, building, floor } = req.body;

    // Check if classroom exists
    const existingClassroom = await Classroom.findOne({ name });
    if (existingClassroom) {
      return res.status(400).json({
        success: false,
        message: 'Classroom with this name already exists'
      });
    }

    // Create classroom
    const classroom = new Classroom({
      name,
      capacity,
      isLab: isLab || false,
      building: building || 'Main Building',
      floor: floor || 0
    });

    await classroom.save();
    
    res.status(201).json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update classroom
exports.updateClassroom = async (req, res) => {
  try {
    // Find classroom by ID
    let classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    const { name } = req.body;
    
    // Check if name is being updated and would create a duplicate
    if (name && name !== classroom.name) {
      const existingClassroom = await Classroom.findOne({ name });
      if (existingClassroom) {
        return res.status(400).json({
          success: false,
          message: 'Classroom with this name already exists'
        });
      }
    }
    
    // Update classroom
    classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete classroom
exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }
    
    await classroom.deleteOne();
    
    res.json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
