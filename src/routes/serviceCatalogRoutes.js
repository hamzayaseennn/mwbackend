const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceCatalogController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all services
router.get('/', getAllServices);

// Get single service
router.get('/:id', getServiceById);

// Create new service (Admin only)
router.post('/', createService);

// Update service (Admin only)
router.put('/:id', updateService);

// Delete service (Admin only)
router.delete('/:id', deleteService);

module.exports = router;

