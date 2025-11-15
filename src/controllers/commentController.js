const Comment = require('../models/Comment');
const Job = require('../models/Job');

// @desc    Get all comments for a job
// @route   GET /api/comments/job/:jobId
// @access  Private
const getCommentsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const comments = await Comment.find({
      job: jobId,
      isActive: true
    }).sort({ createdAt: 1 }); // Sort by creation date ascending (oldest first)

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Get comments by job error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching comments'
    });
  }
};

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const {
      job,
      author,
      authorInitials,
      role,
      text,
      attachments
    } = req.body;

    // Validate input
    if (!job || !author || !authorInitials || !role || !text) {
      return res.status(400).json({
        success: false,
        message: 'Job, author, authorInitials, role, and text are required'
      });
    }

    // Check if job exists
    const jobExists = await Job.findById(job);
    if (!jobExists) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const comment = await Comment.create({
      job,
      author,
      authorInitials,
      role,
      text,
      attachments: attachments || []
    });

    // Populate job reference for response
    await comment.populate('job', 'title status');

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('commentAdded', comment);
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating comment'
    });
  }
};

// @desc    Delete a comment (soft delete)
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: comment
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting comment'
    });
  }
};

module.exports = {
  getCommentsByJob,
  createComment,
  deleteComment
};

