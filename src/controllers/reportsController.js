const Invoice = require('../models/Invoice');
const Job = require('../models/Job');
const ServiceHistory = require('../models/ServiceHistory');
const Customer = require('../models/Customer');

// Helper function to get date range
const getDateRange = (period = 'month') => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: now };
};

// @desc    Get financial overview
// @route   GET /api/reports/financial-overview
// @access  Private
const getFinancialOverview = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get all paid invoices in the period
    const paidInvoices = await Invoice.find({
      status: 'Paid',
      date: { $gte: startDate, $lte: endDate },
      isActive: true
    });

    // Calculate total revenue
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Calculate revenue by payment method
    const paymentMethodStats = {};
    paidInvoices.forEach(inv => {
      const method = inv.paymentMethod || 'Other';
      paymentMethodStats[method] = (paymentMethodStats[method] || 0) + (inv.amount || 0);
    });

    // Calculate card payments (Card/POS)
    const cardPayments = paymentMethodStats['Card/POS'] || 0;
    const cashPayments = paymentMethodStats['Cash'] || 0;
    const onlinePayments = paymentMethodStats['Online Transfer'] || 0;
    const otherPayments = paymentMethodStats['Other'] || 0;

    // Calculate net profit (revenue - expenses, for now just revenue as we don't track expenses separately)
    // You can enhance this by tracking expenses in a separate model
    const netProfit = totalRevenue; // Simplified - in real scenario, subtract expenses

    // Calculate profit margin (simplified)
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        cardPayments,
        cashPayments,
        onlinePayments,
        otherPayments,
        netProfit,
        profitMargin: parseFloat(profitMargin),
        period
      }
    });
  } catch (error) {
    console.error('Get financial overview error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching financial overview'
    });
  }
};

// @desc    Get revenue trend (monthly)
// @route   GET /api/reports/revenue-trend
// @access  Private
const getRevenueTrend = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months), 1);

    // Aggregate revenue by month from invoices
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'Paid',
          date: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = monthlyRevenue.map(item => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue || 0,
      profit: item.revenue * 0.5, // Simplified profit calculation (50% margin)
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Get revenue trend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching revenue trend'
    });
  }
};

// @desc    Get payment methods breakdown
// @route   GET /api/reports/payment-methods
// @access  Private
const getPaymentMethods = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Aggregate payment methods from paid invoices
    const paymentMethods = await Invoice.aggregate([
      {
        $match: {
          status: 'Paid',
          date: { $gte: startDate, $lte: endDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate total for percentage
    const total = paymentMethods.reduce((sum, item) => sum + item.total, 0);

    // Format data for pie chart
    const colors = {
      'Cash': '#b91c1c',
      'Card/POS': '#c53032',
      'Online Transfer': '#f87171',
      'Cheque': '#dc2626',
      'Other': '#991b1b'
    };

    const paymentData = paymentMethods.map(item => ({
      name: item._id || 'Other',
      value: total > 0 ? Math.round((item.total / total) * 100) : 0,
      amount: item.total,
      count: item.count,
      color: colors[item._id] || colors['Other']
    }));

    res.status(200).json({
      success: true,
      data: paymentData
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payment methods'
    });
  }
};

// @desc    Get popular services
// @route   GET /api/reports/popular-services
// @access  Private
const getPopularServices = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get popular services from jobs
    const popularServices = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$title',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const servicesData = popularServices.map(item => ({
      service: item._id || 'Unknown Service',
      count: item.count,
      revenue: item.totalRevenue || 0
    }));

    res.status(200).json({
      success: true,
      data: servicesData
    });
  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching popular services'
    });
  }
};

// @desc    Get daily performance
// @route   GET /api/reports/daily-performance
// @access  Private
const getDailyPerformance = async (req, res) => {
  try {
    const { days = 14 } = req.query; // Default to 14 days to ensure we cover current week
    // Get current date and calculate start date
    // We'll query with UTC dates but return dates in PKT format
    // Calculate start date going back enough days to cover the range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - parseInt(days) - 1); // Add 1 day buffer for timezone differences
    startDate.setHours(0, 0, 0, 0);

    // Helper function to convert UTC date (from MongoDB) to PKT date string (YYYY-MM-DD)
    // PKT = Pakistan Time = UTC+5
    const convertToPKTDateString = (utcDate) => {
      if (!utcDate) return null;
      try {
        // MongoDB stores dates in UTC - create Date object
        const date = new Date(utcDate);
        if (isNaN(date.getTime())) return null;
        
        // Add 5 hours (18000000 ms) to convert UTC to PKT
        const pktTimestamp = date.getTime() + (5 * 60 * 60 * 1000);
        const pktDate = new Date(pktTimestamp);
        
        // Extract date components - the timestamp already has the 5-hour offset
        // Use UTC methods to extract the date from the adjusted timestamp
        const year = pktDate.getUTCFullYear();
        const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(pktDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error converting date to PKT:', error, utcDate);
        return null;
      }
    };

    // Get all paid invoices with their dates (we'll convert to PKT in JavaScript)
    // Query a wider date range to ensure we capture all invoices for the current week in PKT
    const queryStartDate = new Date(startDate);
    queryStartDate.setDate(queryStartDate.getDate() - 1); // Add 1 day buffer for timezone differences
    
    const allInvoices = await Invoice.find({
      status: 'Paid',
      date: { $gte: queryStartDate },
      isActive: true
    }).select('date amount job').lean();

    // Group invoices by PST date
    const dailyInvoicesMap = {};
    const dailyJobsMap = {};

    allInvoices.forEach(invoice => {
      const pktDateStr = convertToPKTDateString(invoice.date);
      
      if (!pktDateStr) return; // Skip if date conversion failed
      
      // Count revenue
      if (!dailyInvoicesMap[pktDateStr]) {
        dailyInvoicesMap[pktDateStr] = 0;
      }
      dailyInvoicesMap[pktDateStr] += invoice.amount || 0;

      // Count completed jobs (invoices with job reference)
      if (invoice.job) {
        if (!dailyJobsMap[pktDateStr]) {
          dailyJobsMap[pktDateStr] = 0;
        }
        dailyJobsMap[pktDateStr] += 1;
      }
    });

    // Generate PKT dates for the date range (last N days, most recent first)
    // Calculate current PKT date (UTC+5)
    const nowUTC = new Date();
    const nowPKTTimestamp = nowUTC.getTime() + (5 * 60 * 60 * 1000); // Convert to PKT
    const todayPKT = new Date(nowPKTTimestamp);
    todayPKT.setUTCHours(0, 0, 0, 0);
    todayPKT.setUTCMinutes(0, 0, 0);
    todayPKT.setUTCSeconds(0, 0);

    // Combine and format data - return dates in PKT format (most recent first)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyStats = [];

    for (let i = parseInt(days) - 1; i >= 0; i--) {
      // Calculate date going back from today in PKT
      const targetTimestamp = todayPKT.getTime() - (i * 24 * 60 * 60 * 1000);
      const pktDate = new Date(targetTimestamp);
      
      // Get PKT date string (YYYY-MM-DD) using UTC methods (since we've adjusted the timestamp)
      const year = pktDate.getUTCFullYear();
      const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(pktDate.getUTCDate()).padStart(2, '0');
      const pktDateStr = `${year}-${month}-${day}`;

      // Get jobs and revenue for this PKT date
      const jobs = dailyJobsMap[pktDateStr] || 0;
      const revenue = dailyInvoicesMap[pktDateStr] || 0;

      // Return date in PKT format
      dailyStats.push({
        day: dayNames[pktDate.getUTCDay()],
        date: pktDateStr,
        jobs: jobs,
        revenue: revenue
      });
    }

    res.status(200).json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    console.error('Get daily performance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching daily performance'
    });
  }
};

module.exports = {
  getFinancialOverview,
  getRevenueTrend,
  getPaymentMethods,
  getPopularServices,
  getDailyPerformance
};

