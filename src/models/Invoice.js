const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false
  },
  invoiceNumber: {
    type: String,
    unique: true,
    trim: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  vehicle: {
    make: { type: String, trim: true },
    model: { type: String, trim: true },
    year: { type: Number },
    plateNo: { type: String, trim: true }
  },
  items: {
    type: [invoiceItemSchema],
    required: [true, 'Items are required'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'At least one item is required'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card/POS', 'Online Transfer', 'Cheque', 'Other'],
    trim: true
  },
  technician: {
    type: String,
    trim: true
  },
  supervisor: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for search (invoiceNumber already has unique index, so we don't need to add it again)
invoiceSchema.index({ customer: 1, date: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;

