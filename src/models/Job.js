const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  plateNo: {
    type: String,
    trim: true
  }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  estimatedTime: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  catalogId: {
    type: String,
    default: null
  }
}, { _id: false });

const jobSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  vehicle: {
    type: vehicleSchema,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'],
    default: 'PENDING'
  },
  technician: {
    type: String,
    trim: true
  },
  estimatedTimeHours: {
    type: Number,
    min: 0
  },
  amount: {
    type: Number,
    min: 0,
    default: 0
  },
  services: {
    type: [serviceSchema],
    default: []
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for status filtering
jobSchema.index({ status: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;

