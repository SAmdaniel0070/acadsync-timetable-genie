
const { validationResult } = require('express-validator');
const Class = require('../models/Class');
const Year = require('../models/Year');

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('year', 'name value');
    
    res.json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get class by ID
exports.getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id).populate('year', 'name value');
    
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    res.json({
      success: true,
      class: classItem
    });
  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get classes by year
exports.getClassesByYear = async (req, res) => {
  try {
    const classes = await Class.find({ year: req.params.yearId })
      .populate('year', 'name value');
    
    res.json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error) {
    console.error('Get classes by year error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create class
exports.createClass = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, year, section, totalStudents } = req.body;

    // Check if year exists
    const yearExists = await Year.findById(year);
    if (!yearExists) {
      return res.status(400).json({
        success: false,
        message: 'Year not found'
      });
    }

    // Check if class exists with same name, year, and section
    const existingClass = await Class.findOne({ name, year, section });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class already exists with this name, year, and section'
      });
    }

    // Create class
    const newClass = new Class({
      name,
      year,
      section,
      totalStudents: totalStudents || 0
    });

    await newClass.save();
    
    // Populate year details
    await newClass.populate('year', 'name value');
    
    res.status(201).json({
      success: true,
      class: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    // Find class by ID
    let classItem = await Class.findById(req.params.id);
    
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    const { name, year, section } = req.body;
    
    // If year is being updated, check if it exists
    if (year && year !== classItem.year.toString()) {
      const yearExists = await Year.findById(year);
      if (!yearExists) {
        return res.status(400).json({
          success: false,
          message: 'Year not found'
        });
      }
    }
    
    // Check if updates would create a duplicate
    if (name || year || section) {
      const existingClass = await Class.findOne({
        _id: { $ne: req.params.id },
        name: name || classItem.name,
        year: year || classItem.year,
        section: section || classItem.section
      });
      
      if (existingClass) {
        return res.status(400).json({
          success: false,
          message: 'Class already exists with this name, year, and section'
        });
      }
    }
    
    // Update class
    classItem = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('year', 'name value');
    
    res.json({
      success: true,
      class: classItem
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    await classItem.deleteOne();
    
    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
