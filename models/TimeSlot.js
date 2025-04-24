
const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String,
    required: true,
    trim: true
  },
  endTime: {
    type: String,
    required: true,
    trim: true
  },
  isBreak: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
