require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    console.log('Starting server...');
    
    // Wait for MongoDB connection before starting server
    await connectDB();
    
    console.log('MongoDB connection established successfully');
    
    // Start server only after MongoDB is connected
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API available at: http://localhost:${PORT}`);
      console.log(`✅ Server ready to accept requests`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Please check your MongoDB connection and try again.');
    process.exit(1);
  }
};

startServer();

