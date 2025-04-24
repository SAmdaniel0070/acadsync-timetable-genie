
const { validationResult } = require('express-validator');
const Timing = require('../models/Timing');
const TimeSlot = require('../models/TimeSlot');

// Get all timings
exports.getAllTimings = async (req, res) => {
  try {
    const timings = await Timing.find().populate('timeSlots');
    
    res.json({
      success: true,
      count: timings.length,
      timings
    });
  } catch (error) {
    console.error('Get all timings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get active timing
exports.getActiveTiming = async (req, res) => {
  try {
    const timing = await Timing.findOne({ isActive: true }).populate('timeSlots');
    
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'No active timing found'
      });
    }
    
    res.json({
      success: true,
      timing
    });
  } catch (error) {
    console.error('Get active timing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get timing by ID
exports.getTimingById = async (req, res) => {
  try {
    const timing = await Timing.findById(req.params.id).populate({
      path: 'timeSlots',
      options: { sort: { order: 1 } }
    });
    
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'Timing not found'
      });
    }
    
    res.json({
      success: true,
      timing
    });
  } catch (error) {
    console.error('Get timing by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create timing
exports.createTiming = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { academicYear, periodsPerDay, workingDays } = req.body;

    // Create timing
    const timing = new Timing({
      academicYear,
      periodsPerDay,
      workingDays,
      timeSlots: [],
      isActive: false
    });

    await timing.save();
    
    res.status(201).json({
      success: true,
      timing
    });
  } catch (error) {
    console.error('Create timing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update timing
exports.updateTiming = async (req, res) => {
  try {
    // Find timing by ID
    let timing = await Timing.findById(req.params.id);
    
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'Timing not found'
      });
    }
    
    // Update timing
    timing = await Timing.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('timeSlots');
    
    res.json({
      success: true,
      timing
    });
  } catch (error) {
    console.error('Update timing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete timing
exports.deleteTiming = async (req, res) => {
  try {
    const timing = await Timing.findById(req.params.id);
    
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'Timing not found'
      });
    }
    
    // Check if timing is active
    if (timing.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active timing. Set another timing as active first.'
      });
    }
    
    // Delete time slots associated with this timing
    await TimeSlot.deleteMany({ _id: { $in: timing.timeSlots } });
    
    await timing.deleteOne();
    
    res.json({
      success: true,
      message: 'Timing deleted successfully'
    });
  } catch (error) {
    console.error('Delete timing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Set active timing
exports.setActiveTiming = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if timing exists
    const timing = await Timing.findById(id);
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'Timing not found'
      });
    }
    
    // Deactivate all other timings
    await Timing.updateMany(
      { _id: { $ne: id } },
      { $set: { isActive: false } }
    );
    
    // Activate this timing
    timing.isActive = true;
    await timing.save();
    
    res.json({
      success: true,
      message: 'Timing activated successfully'
    });
  } catch (error) {
    console.error('Set active timing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add time slot to timing
exports.addTimeSlotToTiming = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { name, startTime, endTime, isBreak, order } = req.body;

    // Check if timing exists
    const timing = await Timing.findById(id);
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'Timing not found'
      });
    }

    // Create time slot
    const timeSlot = new TimeSlot({
      name,
      startTime,
      endTime,
      isBreak: isBreak || false,
      order: order || timing.timeSlots.length
    });

    await timeSlot.save();
    
    // Add time slot to timing
    timing.timeSlots.push(timeSlot._id);
    await timing.save();
    
    // Populate time slots for response
    await timing.populate({
      path: 'timeSlots',
      options: { sort: { order: 1 } }
    });
    
    res.status(201).json({
      success: true,
      message: 'Time slot added successfully',
      timing
    });
  } catch (error) {
    console.error('Add time slot to timing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove time slot from timing
exports.removeTimeSlotFromTiming = async (req, res) => {
  try {
    const { id, slotId } = req.params;
    
    // Check if timing exists
    const timing = await Timing.findById(id);
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: 'Timing not found'
      });
    }
    
    // Check if time slot exists
    const timeSlot = await TimeSlot.findById(slotId);
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }
    
    // Check if time slot belongs to this timing
    if (!timing.timeSlots.includes(slotId)) {
      return res.status(400).json({
        success: false,
        message: 'Time slot does not belong to this timing'
      });
    }
    
    // Remove time slot from timing
    timing.timeSlots = timing.timeSlots.filter(
      slot => slot.toString() !== slotId
    );
    
    await timing.save();
    
    // Delete the time slot
    await timeSlot.deleteOne();
    
    // Populate time slots for response
    await timing.populate({
      path: 'timeSlots',
      options: { sort: { order: 1 } }
    });
    
    res.json({
      success: true,
      message: 'Time slot removed successfully',
      timing
    });
  } catch (error) {
    console.error('Remove time slot from timing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
