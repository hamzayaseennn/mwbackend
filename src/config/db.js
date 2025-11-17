const mongoose = require('mongoose');

// Default connection URI (local MongoDB)
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/momentum-pos';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment
    const uri = process.env.MONGODB_URI;
    
    // In production (Railway), MONGODB_URI is REQUIRED
    if (!uri && (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT)) {
      console.error('\n═══════════════════════════════════════════════════════');
      console.error('🔴 MONGODB_URI ENVIRONMENT VARIABLE NOT SET');
      console.error('═══════════════════════════════════════════════════════');
      console.error('\n❌ CRITICAL: MONGODB_URI environment variable is required!');
      console.error('\n📋 Quick Fix Steps for Railway:');
      console.error('\n1. ✅ Go to Railway Dashboard:');
      console.error('   → Open your service → Variables tab');
      console.error('   → Click "New Variable"');
      console.error('\n2. ✅ Add MONGODB_URI variable:');
      console.error('   → Name: MONGODB_URI');
      console.error('   → Value: mongodb+srv://momentum:Qwerty%4012345@cluster0.kkywdqf.mongodb.net/momentum-pos?appName=Cluster0&retryWrites=true&w=majority');
      console.error('\n3. ✅ Redeploy:');
      console.error('   → Railway will automatically redeploy after adding the variable');
      console.error('   → Or click "Redeploy" in the Railway dashboard');
      console.error('\n═══════════════════════════════════════════════════════\n');
      throw new Error('MONGODB_URI environment variable is required in production');
    }
    
    // For local development, use default if not set
    const finalUri = uri || DEFAULT_URI;
    
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    // Connection options for Railway and local development
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections in the pool
      socketTimeoutMS: 45000, // Socket timeout
    };

    console.log('Connecting to MongoDB...');
    console.log(`Using URI: ${finalUri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    
    const conn = await mongoose.connect(finalUri, connectionOptions);

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
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY;
    
    if (isRailway && !process.env.MONGODB_URI) {
      console.error('\n═══════════════════════════════════════════════════════');
      console.error('🔴 RAILWAY DEPLOYMENT: MONGODB_URI NOT CONFIGURED');
      console.error('═══════════════════════════════════════════════════════');
      console.error('\n❌ The MONGODB_URI environment variable is missing!');
      console.error('\n📋 IMMEDIATE ACTION REQUIRED:');
      console.error('\n1. Go to Railway Dashboard → Your Service → Variables');
      console.error('2. Click "New Variable"');
      console.error('3. Add:');
      console.error('   Name: MONGODB_URI');
      console.error('   Value: mongodb+srv://momentum:Qwerty%4012345@cluster0.kkywdqf.mongodb.net/momentum-pos?appName=Cluster0&retryWrites=true&w=majority');
      console.error('4. Click "Add" and Railway will auto-redeploy');
      console.error('\n💡 Also verify MongoDB Atlas Network Access allows Railway IPs');
      console.error('   → Go to MongoDB Atlas → Network Access');
      console.error('   → Add 0.0.0.0/0 (all IPs) or Railway-specific IPs');
      console.error('\n═══════════════════════════════════════════════════════\n');
    } else if (isAtlas) {
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
      // Local MongoDB connection failed
      if (isRailway) {
        console.error('\n═══════════════════════════════════════════════════════');
        console.error('🔴 RAILWAY: USING LOCAL MONGODB (WRONG!)');
        console.error('═══════════════════════════════════════════════════════');
        console.error('\n❌ You are trying to connect to local MongoDB on Railway!');
        console.error('   This will NEVER work. You MUST use MongoDB Atlas.');
        console.error('\n📋 FIX: Add MONGODB_URI environment variable in Railway');
        console.error('   → Go to Railway Dashboard → Variables');
        console.error('   → Add: MONGODB_URI=mongodb+srv://momentum:Qwerty%4012345@cluster0.kkywdqf.mongodb.net/momentum-pos?appName=Cluster0&retryWrites=true&w=majority');
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
    }
    
    throw error;
  }
};

// Check if database is connected
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, isConnected };

