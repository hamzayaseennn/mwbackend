const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customers'
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customer'
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating customer'
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    // Check if customer exists
    let customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // If phone is being updated, check for duplicates
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({ phone });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this phone number already exists'
        });
      }
    }

    // Update customer
    customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name: name || customer.name,
        phone: phone || customer.phone,
        email: email !== undefined ? email : customer.email,
        address: address !== undefined ? address : customer.address,
        notes: notes !== undefined ? notes : customer.notes
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating customer'
    });
  }
};

// @desc    Delete customer (soft delete)
// @route   DELETE /api/customers/:id
// @access  Private (Admin only for hard delete with cascade)
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if user is admin
    const isAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');

    let vehiclesDeletedCount = 0;

    // If admin, delete all vehicles associated with this customer
    if (isAdmin) {
      // Delete all vehicles associated with this customer
      const deleteResult = await Vehicle.deleteMany({ customer: customer._id });
      vehiclesDeletedCount = deleteResult.deletedCount;
      console.log(`Deleted ${vehiclesDeletedCount} vehicle(s) associated with customer ${customer._id}`);
    }

    // Soft delete: set isActive to false
    customer.isActive = false;
    await customer.save();

    res.status(200).json({
      success: true,
      message: isAdmin 
        ? `Customer and ${vehiclesDeletedCount} associated vehicle(s) deleted successfully`
        : 'Customer deleted successfully',
      data: customer,
      vehiclesDeleted: vehiclesDeletedCount
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting customer'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

