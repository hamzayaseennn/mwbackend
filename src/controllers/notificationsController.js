const Vehicle = require('../models/Vehicle');
const Job = require('../models/Job');
const ServiceHistory = require('../models/ServiceHistory');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const { sendServiceReminderEmail } = require('../utils/emailService');
const { sendWhatsAppMessage } = require('../utils/whatsappService');

// Helper to calculate days until service
const getDaysUntilService = (serviceDate) => {
  if (!serviceDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const service = new Date(serviceDate);
  service.setHours(0, 0, 0, 0);
  const diffTime = service.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper to determine priority
const getPriority = (daysUntil) => {
  if (daysUntil < 0) return 'high'; // Overdue
  if (daysUntil <= 3) return 'high'; // Due soon
  if (daysUntil <= 7) return 'medium';
  return 'low';
};

// Helper to determine status
const getStatus = (daysUntil, lastSent) => {
  if (daysUntil < 0) return 'overdue';
  if (lastSent) return 'sent';
  return 'pending';
};

// @desc    Get notifications and reminders
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get vehicles with upcoming or overdue services
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('customer', 'name phone email')
      .lean();

    // Get notification history to check sent status
    const notificationHistory = await Notification.find({
      vehicle: { $in: vehicles.map(v => v._id) }
    }).lean();

    const notifications = [];

    for (const vehicle of vehicles) {
      if (!vehicle.customer) continue;

      const customer = vehicle.customer;
      const nextServiceDate = vehicle.nextService;
      const lastServiceDate = vehicle.lastService;

      if (nextServiceDate) {
        const daysUntil = getDaysUntilService(nextServiceDate);
        const priority = getPriority(daysUntil);
        
        // Check if notification was sent
        const sentNotification = notificationHistory.find(
          n => n.vehicle.toString() === vehicle._id.toString()
        );
        const emailSent = sentNotification?.emailSent || false;
        const whatsappSent = sentNotification?.whatsappSent || false;
        const sent = emailSent || whatsappSent;

        // Determine service type based on last service or default
        let serviceType = 'General Service';
        if (lastServiceDate) {
          const daysSinceLastService = getDaysUntilService(lastServiceDate);
          if (daysSinceLastService && Math.abs(daysSinceLastService) > 90) {
            serviceType = 'Oil Change';
          }
        }

        notifications.push({
          id: vehicle._id.toString(),
          customerId: customer._id.toString(),
          vehicleId: vehicle._id.toString(),
          notificationId: sentNotification?._id?.toString(),
          type: daysUntil < 0 ? 'service_overdue' : 'service_due',
          title: daysUntil < 0 ? 'Overdue Service Alert' : 'Service Reminder',
          message: `${vehicle.make} ${vehicle.model} (${vehicle.plateNo}) - ${serviceType} ${daysUntil < 0 ? `overdue by ${Math.abs(daysUntil)} days` : `due in ${daysUntil} days`}`,
          customer: customer.name || 'Unknown',
          phone: customer.phone || 'N/A',
          email: customer.email || 'N/A',
          vehicle: {
            make: vehicle.make,
            model: vehicle.model,
            plateNo: vehicle.plateNo,
            year: vehicle.year
          },
          dueDate: nextServiceDate,
          priority: priority,
          sent: sent,
          emailSent: emailSent,
          whatsappSent: whatsappSent,
          daysUntil: daysUntil,
          timestamp: vehicle.updatedAt || vehicle.createdAt
        });
      }
    }

    // Sort by priority and days until
    notifications.sort((a, b) => {
      if (a.daysUntil < 0 && b.daysUntil >= 0) return -1;
      if (a.daysUntil >= 0 && b.daysUntil < 0) return 1;
      return Math.abs(a.daysUntil) - Math.abs(b.daysUntil);
    });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notifications'
    });
  }
};

// @desc    Get notifications statistics
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all vehicles with service dates
    const vehicles = await Vehicle.find({ 
      isActive: true,
      nextService: { $exists: true }
    }).lean();

    let pendingReminders = 0;
    let overdueAlerts = 0;
    let scheduled = 0;
    let sentToday = 0; // This would be tracked in a separate model in production

    vehicles.forEach(vehicle => {
      if (!vehicle.nextService) return;
      
      const daysUntil = getDaysUntilService(vehicle.nextService);
      
      if (daysUntil < 0) {
        overdueAlerts++;
        pendingReminders++;
      } else if (daysUntil <= 7) {
        pendingReminders++;
        scheduled++;
      } else {
        scheduled++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        pendingReminders,
        sentToday,
        overdueAlerts,
        scheduled
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notification stats'
    });
  }
};

// @desc    Get service reminders (detailed)
// @route   GET /api/notifications/service-reminders
// @access  Private
const getServiceReminders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get vehicles with service dates
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('customer', 'name phone email')
      .lean();

    const reminders = [];

    for (const vehicle of vehicles) {
      if (!vehicle.customer || !vehicle.nextService) continue;

      const customer = vehicle.customer;
      const daysUntil = getDaysUntilService(vehicle.nextService);
      const priority = getPriority(daysUntil);
      
      // Determine service type
      let serviceType = 'General Service';
      let icon = 'wrench';
      
      if (vehicle.oilType) {
        serviceType = 'Oil Change';
        icon = 'droplet';
      } else if (vehicle.lastService) {
        const lastService = new Date(vehicle.lastService);
        const daysSince = Math.floor((today - lastService) / (1000 * 60 * 60 * 24));
        if (daysSince > 90) {
          serviceType = 'Oil Change';
          icon = 'droplet';
        }
      }

      // Determine status
      let status = 'Pending';
      if (daysUntil < 0) {
        status = 'Overdue';
      }

      reminders.push({
        id: vehicle._id.toString(),
        title: `${serviceType} ${daysUntil < 0 ? 'Overdue' : 'Due'}`,
        message: `${serviceType} ${daysUntil < 0 ? `overdue by ${Math.abs(daysUntil)} days` : `due in ${daysUntil} days`} based on service schedule`,
        customer: customer.name || 'Unknown',
        phone: customer.phone || 'N/A',
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          plate: vehicle.plateNo,
          year: vehicle.year
        },
        dueDate: vehicle.nextService,
        priority: priority.charAt(0).toUpperCase() + priority.slice(1), // Capitalize
        status: status,
        timestamp: vehicle.updatedAt || vehicle.createdAt,
        icon: icon
      });
    }

    // Sort by priority and days until
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    reminders.sort((a, b) => {
      // Overdue first
      if (a.status === 'Overdue' && b.status !== 'Overdue') return -1;
      if (a.status !== 'Overdue' && b.status === 'Overdue') return 1;
      
      // Then by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by days until
      const aDays = getDaysUntilService(a.dueDate);
      const bDays = getDaysUntilService(b.dueDate);
      return Math.abs(aDays || 0) - Math.abs(bDays || 0);
    });

    res.status(200).json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Get service reminders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching service reminders'
    });
  }
};

// @desc    Send email notification
// @route   POST /api/notifications/send-email
// @access  Private
const sendEmailNotification = async (req, res) => {
  try {
    const { customerId, vehicleId, notificationId } = req.body;

    if (!customerId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and Vehicle ID are required'
      });
    }

    // Get customer and vehicle
    const customer = await Customer.findById(customerId);
    const vehicle = await Vehicle.findById(vehicleId).populate('customer', 'name phone email');

    if (!customer || !vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Customer or vehicle not found'
      });
    }

    if (!customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Customer does not have an email address'
      });
    }

    // Calculate days until service
    const daysUntil = vehicle.nextService ? getDaysUntilService(vehicle.nextService) : null;
    const isOverdue = daysUntil !== null && daysUntil < 0;

    // Send email
    const emailResult = await sendServiceReminderEmail(
      customer.email,
      customer.name,
      {
        make: vehicle.make,
        model: vehicle.model,
        plateNo: vehicle.plateNo,
        year: vehicle.year
      },
      vehicle.nextService,
      daysUntil || 0
    );

    // Save or update notification record
    let notification;
    if (notificationId) {
      notification = await Notification.findById(notificationId);
    } else {
      notification = new Notification({
        customer: customerId,
        vehicle: vehicleId,
        type: isOverdue ? 'service_overdue' : 'service_reminder',
        title: isOverdue ? 'Service Overdue Alert' : 'Service Reminder',
        message: `${vehicle.make} ${vehicle.model} (${vehicle.plateNo}) - ${isOverdue ? `overdue by ${Math.abs(daysUntil)} days` : `due in ${daysUntil} days`}`,
        dueDate: vehicle.nextService,
        priority: getPriority(daysUntil || 0)
      });
    }

    if (emailResult.success) {
      notification.emailSent = true;
      notification.emailSentAt = new Date();
      notification.status = 'sent';
    } else {
      notification.status = 'failed';
      notification.error = emailResult.error;
    }

    await notification.save();

    res.status(200).json({
      success: emailResult.success,
      message: emailResult.success ? 'Email sent successfully' : 'Failed to send email',
      data: notification
    });
  } catch (error) {
    console.error('Send email notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending email notification'
    });
  }
};

// @desc    Send WhatsApp notification
// @route   POST /api/notifications/send-whatsapp
// @access  Private
const sendWhatsAppNotification = async (req, res) => {
  try {
    const { customerId, vehicleId, notificationId } = req.body;

    if (!customerId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and Vehicle ID are required'
      });
    }

    // Get customer and vehicle
    const customer = await Customer.findById(customerId);
    const vehicle = await Vehicle.findById(vehicleId).populate('customer', 'name phone email');

    if (!customer || !vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Customer or vehicle not found'
      });
    }

    if (!customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer does not have a phone number'
      });
    }

    // Calculate days until service
    const daysUntil = vehicle.nextService ? getDaysUntilService(vehicle.nextService) : null;
    const isOverdue = daysUntil !== null && daysUntil < 0;

    // Format phone number (remove spaces, add country code if needed)
    let phoneNumber = customer.phone.replace(/\s+/g, '');
    // If phone doesn't start with +, assume it's a local number (you may need to adjust this)
    if (!phoneNumber.startsWith('+')) {
      // For Pakistan, add +92 if it starts with 0
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+92' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('92')) {
        phoneNumber = '+92' + phoneNumber;
      } else {
        phoneNumber = '+' + phoneNumber;
      }
    }

    // Create WhatsApp message
    const message = `🔔 *Momentum AutoWorks - Service Reminder*\n\n` +
      `Hello ${customer.name},\n\n` +
      `${isOverdue 
        ? `⚠️ Your vehicle *${vehicle.make} ${vehicle.model} (${vehicle.plateNo})* is overdue for service by *${Math.abs(daysUntil)} days*.\n\n`
        : `Your vehicle *${vehicle.make} ${vehicle.model} (${vehicle.plateNo})* is due for service in *${daysUntil} days*.\n\n`
      }` +
      `*Service Due Date:* ${new Date(vehicle.nextService).toLocaleDateString()}\n\n` +
      `Please schedule an appointment with us to ensure your vehicle is properly maintained.\n\n` +
      `Thank you,\nMomentum AutoWorks Team`;

    // Send WhatsApp
    const whatsappResult = await sendWhatsAppMessage(phoneNumber, message);

    // Save or update notification record
    let notification;
    if (notificationId) {
      notification = await Notification.findById(notificationId);
    } else {
      notification = new Notification({
        customer: customerId,
        vehicle: vehicleId,
        type: isOverdue ? 'service_overdue' : 'service_reminder',
        title: isOverdue ? 'Service Overdue Alert' : 'Service Reminder',
        message: `${vehicle.make} ${vehicle.model} (${vehicle.plateNo}) - ${isOverdue ? `overdue by ${Math.abs(daysUntil)} days` : `due in ${daysUntil} days`}`,
        dueDate: vehicle.nextService,
        priority: getPriority(daysUntil || 0)
      });
    }

    if (whatsappResult.success) {
      notification.whatsappSent = true;
      notification.whatsappSentAt = new Date();
      notification.status = 'sent';
    } else {
      notification.status = 'failed';
      notification.error = whatsappResult.error;
    }

    await notification.save();

    res.status(200).json({
      success: whatsappResult.success,
      message: whatsappResult.success ? 'WhatsApp message sent successfully' : 'Failed to send WhatsApp message',
      data: notification
    });
  } catch (error) {
    console.error('Send WhatsApp notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending WhatsApp notification'
    });
  }
};

// @desc    Send bulk notifications
// @route   POST /api/notifications/send-bulk
// @access  Private
const sendBulkNotifications = async (req, res) => {
  try {
    const { type, method } = req.body; // type: 'all', 'overdue', 'due_soon', method: 'email', 'whatsapp', 'both'

    if (!type || !method) {
      return res.status(400).json({
        success: false,
        message: 'Type and method are required'
      });
    }

    // Get vehicles based on type
    let vehicles;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'overdue') {
      vehicles = await Vehicle.find({
        isActive: true,
        nextService: { $lt: today }
      }).populate('customer', 'name phone email');
    } else if (type === 'due_soon') {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      vehicles = await Vehicle.find({
        isActive: true,
        nextService: { $gte: today, $lte: nextWeek }
      }).populate('customer', 'name phone email');
    } else {
      vehicles = await Vehicle.find({
        isActive: true,
        nextService: { $exists: true }
      }).populate('customer', 'name phone email');
    }

    const results = {
      total: vehicles.length,
      emailSent: 0,
      whatsappSent: 0,
      failed: 0,
      errors: []
    };

    for (const vehicle of vehicles) {
      if (!vehicle.customer) continue;

      const customer = vehicle.customer;
      const daysUntil = getDaysUntilService(vehicle.nextService);

      try {
        if (method === 'email' || method === 'both') {
          if (customer.email) {
            const emailResult = await sendServiceReminderEmail(
              customer.email,
              customer.name,
              {
                make: vehicle.make,
                model: vehicle.model,
                plateNo: vehicle.plateNo,
                year: vehicle.year
              },
              vehicle.nextService,
              daysUntil || 0
            );

            if (emailResult.success) {
              results.emailSent++;
              // Save notification
              await Notification.findOneAndUpdate(
                { customer: customer._id, vehicle: vehicle._id },
                {
                  customer: customer._id,
                  vehicle: vehicle._id,
                  type: daysUntil < 0 ? 'service_overdue' : 'service_reminder',
                  emailSent: true,
                  emailSentAt: new Date(),
                  status: 'sent'
                },
                { upsert: true, new: true }
              );
            } else {
              results.failed++;
            }
          }
        }

        if (method === 'whatsapp' || method === 'both') {
          if (customer.phone) {
            let phoneNumber = customer.phone.replace(/\s+/g, '');
            if (!phoneNumber.startsWith('+')) {
              if (phoneNumber.startsWith('0')) {
                phoneNumber = '+92' + phoneNumber.substring(1);
              } else if (!phoneNumber.startsWith('92')) {
                phoneNumber = '+92' + phoneNumber;
              } else {
                phoneNumber = '+' + phoneNumber;
              }
            }

            const message = `🔔 *Momentum AutoWorks - Service Reminder*\n\n` +
              `Hello ${customer.name},\n\n` +
              `${daysUntil < 0 
                ? `⚠️ Your vehicle *${vehicle.make} ${vehicle.model} (${vehicle.plateNo})* is overdue for service by *${Math.abs(daysUntil)} days*.\n\n`
                : `Your vehicle *${vehicle.make} ${vehicle.model} (${vehicle.plateNo})* is due for service in *${daysUntil} days*.\n\n`
              }` +
              `*Service Due Date:* ${new Date(vehicle.nextService).toLocaleDateString()}\n\n` +
              `Please schedule an appointment with us.\n\n` +
              `Thank you,\nMomentum AutoWorks Team`;

            const whatsappResult = await sendWhatsAppMessage(phoneNumber, message);

            if (whatsappResult.success) {
              results.whatsappSent++;
              // Save notification
              await Notification.findOneAndUpdate(
                { customer: customer._id, vehicle: vehicle._id },
                {
                  customer: customer._id,
                  vehicle: vehicle._id,
                  type: daysUntil < 0 ? 'service_overdue' : 'service_reminder',
                  whatsappSent: true,
                  whatsappSentAt: new Date(),
                  status: 'sent'
                },
                { upsert: true, new: true }
              );
            } else {
              results.failed++;
            }
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          customer: customer.name,
          vehicle: `${vehicle.make} ${vehicle.model}`,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk notifications sent. Email: ${results.emailSent}, WhatsApp: ${results.whatsappSent}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending bulk notifications'
    });
  }
};

// @desc    Get notification history
// @route   GET /api/notifications/history
// @access  Private
const getNotificationHistory = async (req, res) => {
  try {
    const { customer, vehicle, limit = 50 } = req.query;
    let query = {};

    if (customer) {
      query.customer = customer;
    }
    if (vehicle) {
      query.vehicle = vehicle;
    }

    const notifications = await Notification.find(query)
      .populate('customer', 'name phone email')
      .populate('vehicle', 'make model plateNo year')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notification history'
    });
  }
};

module.exports = {
  getNotifications,
  getNotificationStats,
  getServiceReminders,
  sendEmailNotification,
  sendWhatsAppNotification,
  sendBulkNotifications,
  getNotificationHistory
};

