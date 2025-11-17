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

    // Validate URI exists
    if (!uri || uri === DEFAULT_URI) {
      if (process.env.VERCEL || process.env.VERCEL_ENV) {
        console.warn('⚠️ MONGODB_URI not set in Vercel environment variables!');
        throw new Error('MONGODB_URI environment variable is not set');
      }
    }

    // For Vercel serverless, use connection pooling
    const connectionOptions = {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for Vercel
    };

    // Add connection pooling options for Vercel
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      connectionOptions.maxPoolSize = 10;
      connectionOptions.minPoolSize = 1;
      connectionOptions.socketTimeoutMS = 45000;
      connectionOptions.connectTimeoutMS = 30000;
      // Keep connection alive for serverless
      connectionOptions.keepAlive = true;
      connectionOptions.keepAliveInitialDelay = 30000;
    }

    console.log('Connecting to MongoDB...');
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      console.log('Vercel environment detected - using serverless connection options');
    }
    
    const conn = await mongoose.connect(uri, connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);

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
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    const isAtlas = uri.includes('mongodb.net');
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    if (isAtlas) {
      console.error('\n═══════════════════════════════════════════════════════');
      console.error('🔴 MONGODB ATLAS CONNECTION FAILED');
      console.error('═══════════════════════════════════════════════════════');
      
      if (isVercel) {
        console.error('\n⚠️  VERCEL DEPLOYMENT DETECTED');
        console.error('\n📋 CRITICAL FIX STEPS FOR VERCEL:');
        console.error('\n1. ✅ MongoDB Atlas Network Access (REQUIRED):');
        console.error('   → Go to: https://cloud.mongodb.com/');
        console.error('   → Click "Network Access" in the left menu');
        console.error('   → Click "Add IP Address"');
        console.error('   → Click "Allow Access from Anywhere" (or enter 0.0.0.0/0)');
        console.error('   → Click "Confirm"');
        console.error('   → ⚠️  This is REQUIRED because Vercel uses dynamic IPs!');
        console.error('\n2. ✅ Verify MONGODB_URI in Vercel:');
        console.error('   → Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
        console.error('   → Ensure MONGODB_URI is set correctly');
        console.error('   → Format: mongodb+srv://username:password@cluster.mongodb.net/database');
        console.error('   → If password contains @, encode it as %40');
        console.error('   → Example: mongodb+srv://user:pass%40word@cluster.mongodb.net/db');
        console.error('\n3. ✅ Verify Database User:');
        console.error('   → Go to MongoDB Atlas → "Database Access"');
        console.error('   → Verify your user exists and has read/write permissions');
        console.error('   → Username and password must match your connection string');
      } else {
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
      }
      
      console.error('\n💡 For Vercel Deployment:');
      console.error('   → You MUST whitelist 0.0.0.0/0 (all IPs)');
      console.error('   → Vercel uses dynamic IP addresses that change frequently');
      console.error('   → This is the standard practice for serverless deployments');
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
    
    // For Vercel, don't throw - allow the app to continue (health check should work)
    if (isVercel) {
      console.error('⚠️  Continuing without database connection (Vercel serverless mode)');
      return null; // Return null instead of throwing
    }
    
    throw error;
  }
};

// Check if database is connected
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, isConnected };

