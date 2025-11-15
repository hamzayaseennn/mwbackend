const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required']
  },
  type: {
    type: String,
    enum: ['service_reminder', 'service_overdue', 'payment_reminder', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  whatsappSent: {
    type: Boolean,
    default: false
  },
  whatsappSentAt: {
    type: Date
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  smsSentAt: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ customer: 1, createdAt: -1 });
notificationSchema.index({ vehicle: 1, createdAt: -1 });
notificationSchema.index({ status: 1, dueDate: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

