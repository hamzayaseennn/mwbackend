const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
const getAllVehicles = async (req, res) => {
  try {
    const { search, customer } = req.query;
    let query = { isActive: true };

    if (customer) {
      query.customer = customer;
    }

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { plateNo: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('Get all vehicles error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching vehicles'
    });
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('customer', 'name phone email address');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching vehicle'
    });
  }
};

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private
const createVehicle = async (req, res) => {
  try {
    const { customer, make, model, year, plateNo, vin, mileage, lastService, nextService, oilType, status } = req.body;

    if (!customer || !make || !model || !year || !plateNo) {
      return res.status(400).json({
        success: false,
        message: 'Customer, make, model, year, and plate number are required'
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

    // Check for duplicate vehicle: same customer + plateNo + VIN (if VIN provided)
    const duplicateQuery = {
      customer,
      plateNo: plateNo.trim(),
      isActive: true
    };
    
    if (vin && vin.trim()) {
      duplicateQuery.vin = vin.trim();
    } else {
      duplicateQuery.vin = null;
    }

    const existingVehicle = await Vehicle.findOne(duplicateQuery);
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: vin && vin.trim() 
          ? 'A vehicle with this customer, plate number, and VIN already exists'
          : 'A vehicle with this customer and plate number already exists'
      });
    }

    const vehicle = await Vehicle.create({
      customer,
      make,
      model,
      year,
      plateNo: plateNo.trim(),
      vin: vin ? vin.trim() : null,
      mileage: mileage || 0,
      lastService: lastService ? new Date(lastService) : undefined,
      nextService: nextService ? new Date(nextService) : undefined,
      oilType,
      status: status || 'Active'
    });

    await vehicle.populate('customer', 'name phone email');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this plate number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating vehicle'
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
const updateVehicle = async (req, res) => {
  try {
    const { make, model, year, plateNo, vin, mileage, lastService, nextService, oilType, status } = req.body;

    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check for duplicate if plateNo or VIN is being updated
    if (plateNo !== undefined || vin !== undefined) {
      const checkPlateNo = plateNo !== undefined ? plateNo.trim() : vehicle.plateNo;
      const checkVin = vin !== undefined ? (vin ? vin.trim() : null) : vehicle.vin;
      
      const duplicateQuery = {
        customer: vehicle.customer,
        plateNo: checkPlateNo,
        isActive: true,
        _id: { $ne: vehicle._id } // Exclude current vehicle
      };
      
      if (checkVin) {
        duplicateQuery.vin = checkVin;
      } else {
        duplicateQuery.vin = null;
      }

      const existingVehicle = await Vehicle.findOne(duplicateQuery);
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: checkVin
            ? 'A vehicle with this customer, plate number, and VIN already exists'
            : 'A vehicle with this customer and plate number already exists'
        });
      }
    }

    if (make !== undefined) vehicle.make = make;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = year;
    if (plateNo !== undefined) vehicle.plateNo = plateNo.trim();
    if (vin !== undefined) vehicle.vin = vin ? vin.trim() : null;
    if (mileage !== undefined) vehicle.mileage = mileage;
    if (lastService !== undefined) vehicle.lastService = lastService ? new Date(lastService) : null;
    if (nextService !== undefined) vehicle.nextService = nextService ? new Date(nextService) : null;
    if (oilType !== undefined) vehicle.oilType = oilType;
    if (status !== undefined) vehicle.status = status;

    await vehicle.save();
    await vehicle.populate('customer', 'name phone email');

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error updating vehicle'
    });
  }
};

// @desc    Delete vehicle (soft delete)
// @route   DELETE /api/vehicles/:id
// @access  Private
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    vehicle.isActive = false;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting vehicle'
    });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};

