const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Job = require('../models/Job');

// Helper function to get Socket.IO instance
const getIO = (req) => {
  return req.app.get('io');
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getAllInvoices = async (req, res) => {
  try {
    const { search, status, customer } = req.query;
    let query = { isActive: true };

    if (status) {
      query.status = status;
    }

    if (customer) {
      query.customer = customer;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'vehicle.plateNo': { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone email')
      .populate('job', 'title status')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching invoices'
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('job', 'title status amount');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching invoice'
    });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const {
      customer,
      job,
      date,
      vehicle,
      items,
      subtotal,
      tax,
      discount,
      amount,
      status,
      paymentMethod,
      technician,
      supervisor,
      notes
    } = req.body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer and items are required'
      });
    }

    // Check if customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate amounts if not provided
    const calculatedSubtotal = subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedTax = tax || 0;
    const calculatedDiscount = discount || 0;
    const calculatedAmount = amount || (calculatedSubtotal + calculatedTax - calculatedDiscount);

    const invoice = await Invoice.create({
      customer,
      job,
      date: date ? new Date(date) : new Date(),
      vehicle,
      items,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      discount: calculatedDiscount,
      amount: calculatedAmount,
      status: status || 'Pending',
      paymentMethod,
      technician,
      supervisor,
      notes
    });

    await invoice.populate('customer', 'name phone email');
    if (job) {
      await invoice.populate('job', 'title status');
    }

    // Emit Socket.IO event for real-time updates
    const io = getIO(req);
    if (io) {
      io.emit('invoiceUpdated', { type: 'created', invoice });
    }

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer or job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating invoice'
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const {
      date,
      vehicle,
      items,
      subtotal,
      tax,
      discount,
      amount,
      status,
      paymentMethod,
      technician,
      supervisor,
      notes
    } = req.body;

    let invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (date !== undefined) invoice.date = new Date(date);
    if (vehicle !== undefined) invoice.vehicle = vehicle;
    if (items !== undefined) {
      invoice.items = items;
      // Recalculate if items changed
      if (items && items.length > 0) {
        invoice.subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        invoice.amount = invoice.subtotal + (invoice.tax || 0) - (invoice.discount || 0);
      }
    }
    if (subtotal !== undefined) invoice.subtotal = subtotal;
    if (tax !== undefined) invoice.tax = tax;
    if (discount !== undefined) invoice.discount = discount;
    if (amount !== undefined) invoice.amount = amount;
    if (status !== undefined) invoice.status = status;
    if (paymentMethod !== undefined) invoice.paymentMethod = paymentMethod;
    if (technician !== undefined) invoice.technician = technician;
    if (supervisor !== undefined) invoice.supervisor = supervisor;
    if (notes !== undefined) invoice.notes = notes;

    await invoice.save();
    await invoice.populate('customer', 'name phone email');
    if (invoice.job) {
      await invoice.populate('job', 'title status');
    }

    // Emit Socket.IO event for real-time updates
    const io = getIO(req);
    if (io) {
      io.emit('invoiceUpdated', { type: 'updated', invoice });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating invoice'
    });
  }
};

// @desc    Delete invoice (soft delete)
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    invoice.isActive = false;
    await invoice.save();

    // Emit Socket.IO event for real-time updates
    const io = getIO(req);
    if (io) {
      io.emit('invoiceUpdated', { type: 'deleted', invoiceId: invoice._id, invoice });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting invoice'
    });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};

