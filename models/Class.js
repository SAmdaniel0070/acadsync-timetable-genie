
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  totalStudents: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create a compound index to ensure unique class-year-section combinations
classSchema.index({ name: 1, year: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
