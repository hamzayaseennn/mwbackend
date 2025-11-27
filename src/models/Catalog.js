const mongoose = require('mongoose');

const catalogItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['service', 'product'],
    required: [true, 'Type is required']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: 0,
    default: 0
  },
  estimatedTime: {
    type: String,
    trim: true,
    default: ''
  },
  // For products
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    trim: true,
    default: 'piece'
  },
  // Visibility: 'default' for global, 'local' for account-specific
  visibility: {
    type: String,
    enum: ['default', 'local'],
    default: 'local'
  },
  // Account/User that owns this item (null for default items)
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
catalogItemSchema.index({ account: 1, type: 1, isActive: 1 });
catalogItemSchema.index({ visibility: 1, isActive: 1 });

const Catalog = mongoose.model('Catalog', catalogItemSchema);

module.exports = Catalog;

