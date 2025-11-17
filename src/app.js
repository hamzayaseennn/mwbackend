const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { isConnected } = require('./config/db');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173'
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection check middleware
const checkDBConnection = (req, res, next) => {
  if (!isConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Health check route
app.get('/health', (req, res) => {
  const dbStatus = isConnected() ? 'connected' : 'disconnected';
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(isConnected() ? 200 : 503).json({ 
    status: isConnected() ? 'OK' : 'SERVICE_UNAVAILABLE',
    message: 'Server is running',
    database: {
      status: dbStatus,
      state: dbStates[dbState] || 'unknown',
      readyState: dbState,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    },
    timestamp: new Date().toISOString()
  });
});

// Test database connection route
app.get('/api/test-db', async (req, res) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }

    // Try a simple query to verify connection works
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    res.status(200).json({
      success: true,
      message: 'Database connection is working',
      database: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        collections: collections.map(c => c.name)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

// API routes (with database connection check)
// Auth routes don't need DB check for login/signup, but other routes do
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', checkDBConnection, require('./routes/customerRoutes'));
app.use('/api/jobs', checkDBConnection, require('./routes/jobRoutes'));
app.use('/api/dashboard', checkDBConnection, require('./routes/dashboardRoutes'));
app.use('/api/vehicles', checkDBConnection, require('./routes/vehicleRoutes'));
app.use('/api/service-history', checkDBConnection, require('./routes/serviceHistoryRoutes'));
app.use('/api/invoices', checkDBConnection, require('./routes/invoiceRoutes'));
app.use('/api/reports', checkDBConnection, require('./routes/reportsRoutes'));
app.use('/api/notifications', checkDBConnection, require('./routes/notificationsRoutes'));
app.use('/api/comments', checkDBConnection, require('./routes/commentRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;

