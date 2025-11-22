const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  plateNo: {
    type: String,
    required: [true, 'Plate number is required'],
    trim: true
  },
  vin: {
    type: String,
    trim: true,
    default: null
  },
  mileage: {
    type: Number,
    default: 0
  },
  lastService: {
    type: Date
  },
  nextService: {
    type: Date
  },
  oilType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Due', 'Inactive'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
vehicleSchema.index({ make: 'text', model: 'text', plateNo: 'text' });

// Index for efficient duplicate checking
vehicleSchema.index({ customer: 1, plateNo: 1, vin: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;

