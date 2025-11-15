const express = require('express');
const router = express.Router();
const {
  getCommentsByJob,
  createComment,
  deleteComment
} = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// All comment routes are protected
router.use(authenticate);

router.get('/job/:jobId', getCommentsByJob);
router.post('/', createComment);
router.delete('/:id', deleteComment);

module.exports = router;

