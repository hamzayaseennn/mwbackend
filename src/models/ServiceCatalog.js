const mongoose = require('mongoose');

const serviceCatalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  estimatedCost: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedTime: {
    type: String,
    trim: true
  },
  estimatedTimeHours: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  // Sub-options for Oil Change and other services
  hasSubOptions: {
    type: Boolean,
    default: false
  },
  subOptionFields: {
    type: [String],
    default: []
  },
  // Workspace isolation - each admin's workspace has its own catalog
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false // Default services are shared, custom ones are workspace-specific
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
serviceCatalogSchema.index({ workspace: 1, isActive: 1 });
serviceCatalogSchema.index({ name: 'text', description: 'text' });

const ServiceCatalog = mongoose.model('ServiceCatalog', serviceCatalogSchema);

module.exports = ServiceCatalog;

