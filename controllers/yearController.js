
const { validationResult } = require('express-validator');
const Year = require('../models/Year');

// Get all years
exports.getAllYears = async (req, res) => {
  try {
    const years = await Year.find().sort({ value: 1 });
    
    res.json({
      success: true,
      count: years.length,
      years
    });
  } catch (error) {
    console.error('Get all years error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get year by ID
exports.getYearById = async (req, res) => {
  try {
    const year = await Year.findById(req.params.id);
    
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Year not found'
      });
    }
    
    res.json({
      success: true,
      year
    });
  } catch (error) {
    console.error('Get year by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create year
exports.createYear = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, value } = req.body;

    // Check if year exists
    const existingYear = await Year.findOne({ 
      $or: [{ name }, { value }]
    });
    
    if (existingYear) {
      return res.status(400).json({
        success: false,
        message: 'Year with this name or value already exists'
      });
    }

    // Create year
    const year = new Year({
      name,
      value
    });

    await year.save();
    
    res.status(201).json({
      success: true,
      year
    });
  } catch (error) {
    console.error('Create year error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update year
exports.updateYear = async (req, res) => {
  try {
    const { name, value } = req.body;
    
    // Find year by ID
    let year = await Year.findById(req.params.id);
    
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Year not found'
      });
    }
    
    // Check if updated name/value conflicts with other years
    if (name || value) {
      const existingYear = await Year.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(name ? [{ name }] : []),
          ...(value ? [{ value }] : [])
        ]
      });
      
      if (existingYear) {
        return res.status(400).json({
          success: false,
          message: 'Year with this name or value already exists'
        });
      }
    }
    
    // Update year
    year = await Year.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      year
    });
  } catch (error) {
    console.error('Update year error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete year
exports.deleteYear = async (req, res) => {
  try {
    const year = await Year.findById(req.params.id);
    
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Year not found'
      });
    }
    
    await year.deleteOne();
    
    res.json({
      success: true,
      message: 'Year deleted successfully'
    });
  } catch (error) {
    console.error('Delete year error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
