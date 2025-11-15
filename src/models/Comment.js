const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['image', 'file'],
    default: 'file'
  },
  url: {
    type: String,
    trim: true
  }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  authorInitials: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Supervisor', 'Technician', 'Cashier'],
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true
  },
  attachments: {
    type: [attachmentSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
commentSchema.index({ job: 1, createdAt: -1 });
commentSchema.index({ isActive: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;

