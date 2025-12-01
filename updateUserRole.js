// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');

// Get MongoDB URI from environment or use default
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/momentum-pos';
const uri = process.env.MONGODB_URI || DEFAULT_URI;

const updateUserRole = async () => {
  try {
    console.log('🔄 Connecting to database...');
    console.log(`   URI: ${uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
    
    // Connect directly to MongoDB
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to database');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    const email = 'contacthamzaplays@gmail.com';
    const newRole = 'Admin';
    
    console.log(`\n🔍 Searching for user: ${email}`);
    
    // Find user by email (case-insensitive search)
    const user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { email: email }
      ]
    });
    
    if (!user) {
      console.log(`\n❌ User with email ${email} not found.`);
      console.log(`\n📋 Searching for all users in database...`);
      const allUsers = await User.find({}, 'name email role isActive');
      if (allUsers.length > 0) {
        console.log(`\nFound ${allUsers.length} user(s) in database:`);
        allUsers.forEach(u => {
          console.log(`   - ${u.email} (${u.name}) - Role: ${u.role} - Active: ${u.isActive}`);
        });
      } else {
        console.log(`   No users found in database.`);
      }
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`\n📋 Current User Info:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Update role to Admin
    console.log(`\n🔄 Updating role to: ${newRole}...`);
    user.role = newRole;
    await user.save();
    
    console.log(`\n✅ Successfully updated user role!`);
    console.log(`\n📋 Updated User Info:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   New Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed.');
    console.log('\n✨ Done! User role has been updated to Admin.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error updating user role:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Run the script
updateUserRole();

