
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  department: {
    type: String,
    required: true,
    trim: true
  },
  maxHoursPerDay: {
    type: Number,
    default: 6
  },
  unavailableDays: [{
    day: {
      type: Number, // 0 for Monday, 1 for Tuesday, etc.
      required: true
    },
    reason: String
  }],
  unavailableSlots: [{
    day: {
      type: Number,
      required: true
    },
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeSlot',
      required: true
    },
    reason: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);
