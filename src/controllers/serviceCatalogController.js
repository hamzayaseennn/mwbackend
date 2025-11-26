const ServiceCatalog = require('../models/ServiceCatalog');

// Helper function to get Socket.IO instance
const getIO = (req) => {
  return req.app.get('io');
};

// @desc    Get all services (workspace-specific + defaults)
// @route   GET /api/service-catalog
// @access  Private
const getAllServices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, category } = req.query;
    
    // Get user's custom services + default services
    const query = {
      $or: [
        { workspace: userId },
        { isDefault: true }
      ],
      isActive: true
    };

    if (search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    if (category) {
      query.category = category;
    }

    const services = await ServiceCatalog.find(query)
      .sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching services'
    });
  }
};

// @desc    Get single service
// @route   GET /api/service-catalog/:id
// @access  Private
const getServiceById = async (req, res) => {
  try {
    const userId = req.user.id;
    const service = await ServiceCatalog.findOne({
      _id: req.params.id,
      $or: [
        { workspace: userId },
        { isDefault: true }
      ]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching service'
    });
  }
};

// @desc    Create new service
// @route   POST /api/service-catalog
// @access  Private (Admin only)
const createService = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, estimatedCost, estimatedTime, estimatedTimeHours, category, hasSubOptions, subOptionFields } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Service name is required'
      });
    }

    const service = await ServiceCatalog.create({
      name,
      description,
      estimatedCost: estimatedCost || 0,
      estimatedTime,
      estimatedTimeHours,
      category: category || 'General',
      hasSubOptions: hasSubOptions || false,
      subOptionFields: subOptionFields || [],
      workspace: userId,
      isDefault: false,
      isActive: true
    });

    // Emit Socket.IO event
    const io = getIO(req);
    if (io) {
      io.emit('serviceCatalogUpdated', {
        type: 'created',
        service: service
      });
    }

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating service'
    });
  }
};

// @desc    Update service
// @route   PUT /api/service-catalog/:id
// @access  Private (Admin only)
const updateService = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, estimatedCost, estimatedTime, estimatedTimeHours, category, hasSubOptions, subOptionFields } = req.body;

    // Only allow updating own workspace services (not defaults)
    const service = await ServiceCatalog.findOne({
      _id: req.params.id,
      workspace: userId,
      isDefault: false
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you do not have permission to edit it'
      });
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (estimatedCost !== undefined) service.estimatedCost = estimatedCost;
    if (estimatedTime !== undefined) service.estimatedTime = estimatedTime;
    if (estimatedTimeHours !== undefined) service.estimatedTimeHours = estimatedTimeHours;
    if (category !== undefined) service.category = category;
    if (hasSubOptions !== undefined) service.hasSubOptions = hasSubOptions;
    if (subOptionFields !== undefined) service.subOptionFields = subOptionFields;

    await service.save();

    // Emit Socket.IO event
    const io = getIO(req);
    if (io) {
      io.emit('serviceCatalogUpdated', {
        type: 'updated',
        service: service
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
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
      message: error.message || 'Error updating service'
    });
  }
};

// @desc    Delete service (soft delete)
// @route   DELETE /api/service-catalog/:id
// @access  Private (Admin only)
const deleteService = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Only allow deleting own workspace services (not defaults)
    const service = await ServiceCatalog.findOne({
      _id: req.params.id,
      workspace: userId,
      isDefault: false
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you do not have permission to delete it'
      });
    }

    service.isActive = false;
    await service.save();

    // Emit Socket.IO event
    const io = getIO(req);
    if (io) {
      io.emit('serviceCatalogUpdated', {
        type: 'deleted',
        serviceId: req.params.id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting service'
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};

