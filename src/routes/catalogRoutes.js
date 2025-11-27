const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all catalog items (default + account-specific)
router.get('/', catalogController.getCatalog);

// Get catalog items by type
router.get('/type/:type', catalogController.getCatalogByType);

// Create a new catalog item (Admin only)
router.post('/', catalogController.createCatalogItem);

// Update a catalog item (Admin only)
router.put('/:id', catalogController.updateCatalogItem);

// Delete a catalog item (Admin only)
router.delete('/:id', catalogController.deleteCatalogItem);

module.exports = router;

