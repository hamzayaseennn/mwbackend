const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Workshop/Business Settings
  workshop: {
    businessName: { type: String, default: 'Momentum AutoWorks' },
    phone: { type: String, default: '+92 300 1234567' },
    email: { type: String, default: 'info@momentumauto.com' },
    address: { type: String, default: 'Block 5, Clifton, Karachi, Sindh, Pakistan' },
    taxRegistration: { type: String, default: '' },
    currency: { type: String, default: 'PKR (Rs)' },
    logo: { type: String, default: null }, // URL or base64
    themeColor: { type: String, default: '#c53032' }
  },
  // Tax Settings
  tax: {
    cash: { type: Number, default: 18, min: 0, max: 100 },
    card: { type: Number, default: 18, min: 0, max: 100 },
    online: { type: Number, default: 18, min: 0, max: 100 }
  },
  // Notification Settings
  notifications: {
    serviceDueReminders: { type: Boolean, default: true },
    serviceDueDays: { type: Number, default: 7, min: 1 },
    overdueAlerts: { type: Boolean, default: true },
    overdueDays: { type: Number, default: 7, min: 1 },
    jobCompletion: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  },
  // Email Settings
  email: {
    fromEmail: { type: String, default: 'noreply@momentumauto.com' },
    signature: { type: String, default: 'Best regards,\nMomentum AutoWorks Team\n(555) 100-2000\ninfo@momentumauto.com' },
    invoiceSubject: { type: String, default: 'Your Invoice #{invoice_number}' },
    invoiceTemplate: { type: String, default: 'Dear {customer_name},\n\nThank you for choosing Momentum AutoWorks. Please find your invoice attached.' },
    smtpConfigured: { type: Boolean, default: false },
    googleConfigured: { type: Boolean, default: false },
    outlookConfigured: { type: Boolean, default: false }
  },
  // Security Settings
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    sessionTimeout: { type: Boolean, default: true },
    sessionTimeoutMinutes: { type: Number, default: 30, min: 5 }
  },
  // Advanced Settings
  advanced: {
    marketplaceMode: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Create index for faster lookups
settingsSchema.index({ user: 1 });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;


