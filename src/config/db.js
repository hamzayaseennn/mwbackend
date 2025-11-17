const mongoose = require('mongoose');

// Default connection URI (local MongoDB)
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/momentum-pos';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment or use default
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    console.log('Connecting to MongoDB...');
    
    // Simple connection with essential options
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
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
      console.log('MongoDB connection closed');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    const isAtlas = uri.includes('mongodb.net');
    
    if (isAtlas) {
      console.error('\n═══════════════════════════════════════════════════════');
      console.error('🔴 MONGODB ATLAS CONNECTION FAILED');
      console.error('═══════════════════════════════════════════════════════');
      console.error('\n📋 Quick Fix Steps:');
      console.error('\n1. ✅ Whitelist Your IP Address:');
      console.error('   → Go to: https://cloud.mongodb.com/');
      console.error('   → Click "Network Access" in the left menu');
      console.error('   → Click "Add IP Address"');
      console.error('   → Click "Add Current IP Address" (or enter 0.0.0.0/0 for all IPs)');
      console.error('   → Click "Confirm"');
      console.error('\n2. ✅ Verify Connection String:');
      console.error('   → Check your .env file has: MONGODB_URI=mongodb+srv://...');
      console.error('   → Format should be: mongodb+srv://username:password@cluster.mongodb.net/database');
      console.error('\n3. ✅ Check Database User:');
      console.error('   → Go to "Database Access" in MongoDB Atlas');
      console.error('   → Verify your user exists and has read/write permissions');
      console.error('\n💡 For Development (Less Secure):');
      console.error('   → You can whitelist 0.0.0.0/0 to allow all IPs');
      console.error('   → This is OK for development but NOT for production!');
      console.error('\n═══════════════════════════════════════════════════════\n');
    } else {
      console.error('\n═══════════════════════════════════════════════════════');
      console.error('🔴 LOCAL MONGODB CONNECTION FAILED');
      console.error('═══════════════════════════════════════════════════════');
      console.error('\n📋 Quick Fix Steps:');
      console.error('\n1. ✅ Start MongoDB Service:');
      console.error('   → Windows: Open Services, find "MongoDB" and start it');
      console.error('   → Or run: net start MongoDB');
      console.error('   → Mac: brew services start mongodb-community');
      console.error('   → Linux: sudo systemctl start mongod');
      console.error('\n2. ✅ Verify MongoDB is Running:');
      console.error('   → Check if port 27017 is listening');
      console.error('   → Windows: netstat -an | findstr 27017');
      console.error('   → Mac/Linux: lsof -i :27017');
      console.error('\n3. ✅ Install MongoDB if needed:');
      console.error('   → Download from: https://www.mongodb.com/try/download/community');
      console.error('\n4. ✅ Connection String:', DEFAULT_URI);
      console.error('\n═══════════════════════════════════════════════════════\n');
    }
    
    throw error;
  }
};

// Check if database is connected
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, isConnected };

