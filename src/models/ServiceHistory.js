const mongoose = require('mongoose');

const serviceHistorySchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  serviceDate: {
    type: Date,
    required: [true, 'Service date is required'],
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: 0
  },
  technician: {
    type: String,
    trim: true
  },
  mileage: {
    type: Number
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for vehicle and date queries
serviceHistorySchema.index({ vehicle: 1, serviceDate: -1 });
serviceHistorySchema.index({ customer: 1, serviceDate: -1 });

const ServiceHistory = mongoose.model('ServiceHistory', serviceHistorySchema);

module.exports = ServiceHistory;

