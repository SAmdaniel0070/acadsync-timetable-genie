
const mongoose = require('mongoose');

const timingSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  periodsPerDay: {
    type: Number,
    required: true,
    min: 1
  },
  workingDays: [{
    type: Number, // 0 for Monday, 1 for Tuesday, etc.
    required: true
  }],
  timeSlots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timing', timingSchema);
