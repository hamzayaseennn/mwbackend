const Job = require('../models/Job');
const Customer = require('../models/Customer');

// Helper function to get Socket.IO instance
const getIO = (req) => {
  return req.app.get('io');
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
const getAllJobs = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching jobs'
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customer', 'name phone email address');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching job'
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
const createJob = async (req, res) => {
  try {
    const { customer, vehicle, title, description, status, technician, estimatedTimeHours, amount, services, notes } = req.body;

    // Validate required fields
    if (!customer || !vehicle || !title) {
      return res.status(400).json({
        success: false,
        message: 'Customer, vehicle, and title are required'
      });
    }

    // Validate vehicle object
    if (!vehicle.make || !vehicle.model) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle make and model are required'
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

    const job = await Job.create({
      customer,
      vehicle,
      title,
      description,
      status: status || 'PENDING',
      technician,
      estimatedTimeHours,
      amount: amount || 0,
      services: services || [],
      notes: notes || ''
    });

    // Populate customer for response
    await job.populate('customer', 'name phone email');

    // Emit Socket.IO event
    const io = getIO(req);
    if (io) {
      io.emit('jobUpdated', {
        type: 'created',
        job: job
      });
    }

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating job'
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = async (req, res) => {
  try {
    const { vehicle, title, description, status, technician, estimatedTimeHours, amount, services, notes } = req.body;

    // Check if job exists
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Update job fields
    if (vehicle) job.vehicle = { ...job.vehicle, ...vehicle };
    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (status !== undefined) job.status = status;
    if (technician !== undefined) job.technician = technician;
    if (estimatedTimeHours !== undefined) job.estimatedTimeHours = estimatedTimeHours;
    if (amount !== undefined) job.amount = amount;
    if (services !== undefined) job.services = services;
    if (notes !== undefined) job.notes = notes;

    await job.save();

    // Populate customer for response
    await job.populate('customer', 'name phone email');

    // Emit Socket.IO event
    const io = getIO(req);
    if (io) {
      io.emit('jobUpdated', {
        type: 'updated',
        job: job
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating job'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    // Emit Socket.IO event
    const io = getIO(req);
    if (io) {
      io.emit('jobUpdated', {
        type: 'deleted',
        jobId: req.params.id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting job'
    });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};

