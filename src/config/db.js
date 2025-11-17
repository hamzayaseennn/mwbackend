const mongoose = require('mongoose');

// Sensible defaults that avoid long silent buffer timeouts
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/momentum-pos';
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 30000; // 30s - increased for Atlas

// Optional: reduce/disable buffering wait to fail fast
mongoose.set('bufferTimeoutMS', DEFAULT_SERVER_SELECTION_TIMEOUT_MS);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  const serverSelectionTimeoutMS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || DEFAULT_SERVER_SELECTION_TIMEOUT_MS;
  
  // Check if using Atlas (contains mongodb.net)
  const isAtlas = uri.includes('mongodb.net');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS,
      // Additional options for better Atlas connectivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    
    if (isAtlas) {
      console.error('\n=== MongoDB Atlas Connection Troubleshooting ===');
      console.error('1. IP Whitelist: Make sure your current IP address is whitelisted in MongoDB Atlas.');
      console.error('   - Go to: https://cloud.mongodb.com/ → Network Access → Add IP Address');
      console.error('   - For development, you can temporarily use: 0.0.0.0/0 (allows all IPs - less secure)');
      console.error('2. Connection String: Verify your MONGODB_URI in .env file is correct');
      console.error('3. Database User: Ensure the database user exists and has proper permissions');
      console.error('4. Network/Firewall: Check if your firewall or network is blocking the connection');
      console.error('5. Timeout: Current timeout is', serverSelectionTimeoutMS, 'ms');
      console.error('================================================\n');
    } else {
      console.error('\n=== Local MongoDB Connection Troubleshooting ===');
      console.error('1. Make sure MongoDB is running locally');
      console.error('2. Check if MongoDB is listening on port 27017');
      console.error('3. Verify the connection string:', DEFAULT_URI);
      console.error('==================================================\n');
    }
    
    console.error(`Tried URI: ${uri === DEFAULT_URI ? DEFAULT_URI : '[REDACTED ENV URI]'} | serverSelectionTimeoutMS=${serverSelectionTimeoutMS}`);
    console.error('\nPlease fix the connection issue and restart the server.\n');
    
    process.exit(1);
  }
};

module.exports = { connectDB };

