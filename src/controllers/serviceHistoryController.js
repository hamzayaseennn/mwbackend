const ServiceHistory = require('../models/ServiceHistory');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Job = require('../models/Job');

// @desc    Get all service history (including completed jobs)
// @route   GET /api/service-history
// @access  Private
const getAllServiceHistory = async (req, res) => {
  try {
    const { vehicle, customer } = req.query;
    let query = {};

    if (vehicle) {
      query.vehicle = vehicle;
    }

    if (customer) {
      query.customer = customer;
    }

    // Get service history entries
    const serviceHistory = await ServiceHistory.find(query)
      .populate('vehicle', 'make model year plateNo')
      .populate('customer', 'name phone')
      .populate('job', 'title status description technician amount createdAt')
      .sort({ serviceDate: -1 });

    // Get completed/delivered jobs that match the criteria
    let jobQuery = {
      status: { $in: ['COMPLETED', 'DELIVERED'] }
    };

    let vehiclePlateNo = null;
    if (vehicle) {
      // Find jobs for this vehicle by matching plate number
      const vehicleDoc = await Vehicle.findById(vehicle);
      if (vehicleDoc && vehicleDoc.plateNo) {
        vehiclePlateNo = vehicleDoc.plateNo;
        jobQuery['vehicle.plateNo'] = vehicleDoc.plateNo;
      }
    }

    if (customer) {
      jobQuery.customer = customer;
    }

    const completedJobs = await Job.find(jobQuery)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    // Get service history job IDs to avoid duplicates
    const serviceHistoryJobIds = serviceHistory
      .filter(sh => sh.job)
      .map(sh => sh.job._id ? sh.job._id.toString() : sh.job.toString());

    // Filter out jobs that already have service history entries
    const uniqueJobs = completedJobs.filter(job => {
      const jobIdStr = job._id.toString();
      return !serviceHistoryJobIds.includes(jobIdStr);
    });

    // Convert jobs to service history format and combine
    const jobHistory = uniqueJobs.map(job => ({
      _id: job._id,
      job: job._id,
      vehicle: vehicle || null,
      customer: job.customer,
      serviceDate: job.updatedAt || job.createdAt,
      description: job.title + (job.description ? ` - ${job.description}` : ''),
      cost: job.amount || 0,
      technician: job.technician || null,
      mileage: null,
      notes: null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      isFromJob: true, // Flag to identify this came from a job
      jobDetails: {
        title: job.title,
        description: job.description,
        status: job.status,
        vehicle: job.vehicle
      }
    }));

    // Combine service history and job history, sort by date
    const allHistory = [...serviceHistory, ...jobHistory].sort((a, b) => {
      const dateA = new Date(a.serviceDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.serviceDate || b.createdAt || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    res.status(200).json({
      success: true,
      count: allHistory.length,
      data: allHistory
    });
  } catch (error) {
    console.error('Get all service history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching service history'
    });
  }
};

// @desc    Get single service history entry
// @route   GET /api/service-history/:id
// @access  Private
const getServiceHistoryById = async (req, res) => {
  try {
    const serviceHistory = await ServiceHistory.findById(req.params.id)
      .populate('vehicle')
      .populate('customer')
      .populate('job');

    if (!serviceHistory) {
      return res.status(404).json({
        success: false,
        message: 'Service history entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: serviceHistory
    });
  } catch (error) {
    console.error('Get service history by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service history ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching service history'
    });
  }
};

// @desc    Create new service history entry
// @route   POST /api/service-history
// @access  Private
const createServiceHistory = async (req, res) => {
  try {
    const { vehicle, job, customer, serviceDate, description, cost, technician, mileage, notes } = req.body;

    if (!vehicle || !customer || !description || cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle, customer, description, and cost are required'
      });
    }

    // Check if vehicle exists
    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
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

    const serviceHistory = await ServiceHistory.create({
      vehicle,
      job,
      customer,
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      description,
      cost,
      technician,
      mileage,
      notes
    });

    await serviceHistory.populate('vehicle', 'make model year plateNo');
    await serviceHistory.populate('customer', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Service history created successfully',
      data: serviceHistory
    });
  } catch (error) {
    console.error('Create service history error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle or customer ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating service history'
    });
  }
};

// @desc    Update service history entry
// @route   PUT /api/service-history/:id
// @access  Private
const updateServiceHistory = async (req, res) => {
  try {
    const { serviceDate, description, cost, technician, mileage, notes } = req.body;

    let serviceHistory = await ServiceHistory.findById(req.params.id);
    if (!serviceHistory) {
      return res.status(404).json({
        success: false,
        message: 'Service history entry not found'
      });
    }

    if (serviceDate !== undefined) serviceHistory.serviceDate = new Date(serviceDate);
    if (description !== undefined) serviceHistory.description = description;
    if (cost !== undefined) serviceHistory.cost = cost;
    if (technician !== undefined) serviceHistory.technician = technician;
    if (mileage !== undefined) serviceHistory.mileage = mileage;
    if (notes !== undefined) serviceHistory.notes = notes;

    await serviceHistory.save();
    await serviceHistory.populate('vehicle', 'make model year plateNo');
    await serviceHistory.populate('customer', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Service history updated successfully',
      data: serviceHistory
    });
  } catch (error) {
    console.error('Update service history error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service history ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating service history'
    });
  }
};

// @desc    Delete service history entry
// @route   DELETE /api/service-history/:id
// @access  Private
const deleteServiceHistory = async (req, res) => {
  try {
    const serviceHistory = await ServiceHistory.findByIdAndDelete(req.params.id);

    if (!serviceHistory) {
      return res.status(404).json({
        success: false,
        message: 'Service history entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service history deleted successfully'
    });
  } catch (error) {
    console.error('Delete service history error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service history ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting service history'
    });
  }
};

module.exports = {
  getAllServiceHistory,
  getServiceHistoryById,
  createServiceHistory,
  updateServiceHistory,
  deleteServiceHistory
};

