
const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  isLab: {
    type: Boolean,
    default: false
  },
  building: {
    type: String,
    trim: true,
    default: 'Main Building'
  },
  floor: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Classroom', classroomSchema);
