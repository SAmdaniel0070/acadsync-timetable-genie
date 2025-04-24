
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: true
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  isLab: {
    type: Boolean,
    default: false
  },
  creditHours: {
    type: Number,
    required: true,
    min: 1
  },
  periodsPerWeek: {
    type: Number,
    required: true,
    min: 1
  },
  periodsPerDay: {
    type: Number,
    default: 1,
    min: 1
  },
  preferredClassrooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
