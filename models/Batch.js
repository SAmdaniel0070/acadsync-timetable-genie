
const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  strength: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create a compound index to ensure unique batch-class combinations
batchSchema.index({ name: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
