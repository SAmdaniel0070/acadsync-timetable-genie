
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  day: {
    type: Number,  // 0 for Monday, 1 for Tuesday, etc.
    required: true
  },
  timeSlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }
});

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year'
  },
  timing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timing',
    required: true
  },
  lessons: [lessonSchema],
  isActive: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  modifiedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timetable', timetableSchema);
