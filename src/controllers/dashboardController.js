const Job = require('../models/Job');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    // Get today's date range (start and end of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's total jobs
    const todayJobs = await Job.countDocuments({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Count jobs by status
    const jobsByStatus = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const statusCounts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      DELIVERED: 0
    };

    jobsByStatus.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    // Total customers (active only)
    const totalCustomers = await Customer.countDocuments({ isActive: true });

    // Today's revenue (sum of amount for today's invoices with status 'Paid' and isActive: true)
    const todayRevenue = await Invoice.aggregate([
      {
        $match: {
          date: {
            $gte: today,
            $lt: tomorrow
          },
          status: 'Paid', // Only count paid invoices
          isActive: true // Only count active (non-deleted) invoices
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const revenue = todayRevenue.length > 0 ? todayRevenue[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        todayJobs,
        jobsByStatus: statusCounts,
        totalCustomers,
        todayRevenue: revenue
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard summary'
    });
  }
};

module.exports = {
  getDashboardSummary
};

