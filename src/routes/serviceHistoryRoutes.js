const express = require('express');
const router = express.Router();
const {
  getAllServiceHistory,
  getServiceHistoryById,
  createServiceHistory,
  updateServiceHistory,
  deleteServiceHistory
} = require('../controllers/serviceHistoryController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Service history routes
router.get('/', getAllServiceHistory);
router.get('/:id', getServiceHistoryById);
router.post('/', createServiceHistory);
router.put('/:id', updateServiceHistory);
router.delete('/:id', deleteServiceHistory);

module.exports = router;

