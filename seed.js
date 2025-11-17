require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('./src/models/Customer');
const Vehicle = require('./src/models/Vehicle');
const Job = require('./src/models/Job');
const Invoice = require('./src/models/Invoice');
const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/momentum-pos';

// Dummy data
const customersData = [
  {
    name: 'John Smith',
    phone: '03001234567',
    email: 'john.smith@example.com',
    address: '123 Main Street, Lahore',
    notes: 'Regular customer, prefers morning appointments'
  },
  {
    name: 'Sarah Ahmed',
    phone: '03001234568',
    email: 'sarah.ahmed@example.com',
    address: '456 Park Avenue, Karachi',
    notes: 'VIP customer'
  },
  {
    name: 'Ahmed Khan',
    phone: '03001234569',
    email: 'ahmed.khan@example.com',
    address: '789 Model Town, Islamabad',
    notes: 'New customer'
  },
  {
    name: 'Fatima Ali',
    phone: '03001234570',
    email: 'fatima.ali@example.com',
    address: '321 Gulberg, Lahore',
    notes: 'Corporate account'
  },
  {
    name: 'Hassan Malik',
    phone: '03001234571',
    email: 'hassan.malik@example.com',
    address: '654 Faisalabad Road, Faisalabad',
    notes: 'Fleet customer - 5 vehicles'
  },
  {
    name: 'Ayesha Raza',
    phone: '03001234572',
    email: 'ayesha.raza@example.com',
    address: '987 Defence, Karachi',
    notes: 'Premium service required'
  },
  {
    name: 'Bilal Hassan',
    phone: '03001234573',
    email: 'bilal.hassan@example.com',
    address: '147 Johar Town, Lahore',
    notes: 'Regular maintenance customer'
  },
  {
    name: 'Zainab Sheikh',
    phone: '03001234574',
    email: 'zainab.sheikh@example.com',
    address: '258 Clifton, Karachi',
    notes: 'First-time customer'
  }
];

const vehiclesData = [
  { make: 'Toyota', model: 'Corolla', year: 2020, plateNo: 'LHR-1234', mileage: 45000, oilType: '5W-30' },
  { make: 'Honda', model: 'Civic', year: 2019, plateNo: 'KHI-5678', mileage: 52000, oilType: '5W-30' },
  { make: 'Suzuki', model: 'Mehran', year: 2018, plateNo: 'ISB-9012', mileage: 38000, oilType: '10W-40' },
  { make: 'Toyota', model: 'Camry', year: 2021, plateNo: 'LHR-3456', mileage: 25000, oilType: '5W-30' },
  { make: 'Honda', model: 'City', year: 2020, plateNo: 'FSD-7890', mileage: 40000, oilType: '5W-30' },
  { make: 'Toyota', model: 'Vitz', year: 2019, plateNo: 'KHI-2345', mileage: 48000, oilType: '5W-30' },
  { make: 'Suzuki', model: 'Alto', year: 2022, plateNo: 'LHR-6789', mileage: 15000, oilType: '10W-40' },
  { make: 'Toyota', model: 'Corolla', year: 2017, plateNo: 'KHI-0123', mileage: 65000, oilType: '5W-30' }
];

const jobsData = [
  { title: 'Oil Change & Filter', description: 'Regular oil change and oil filter replacement', status: 'COMPLETED', technician: 'Ali Ahmed', estimatedTimeHours: 1, amount: 2500 },
  { title: 'Brake Pad Replacement', description: 'Replace front brake pads', status: 'IN_PROGRESS', technician: 'Hassan Ali', estimatedTimeHours: 2, amount: 8000 },
  { title: 'Engine Tune-up', description: 'Complete engine tune-up and diagnostics', status: 'PENDING', technician: 'Ahmed Khan', estimatedTimeHours: 3, amount: 12000 },
  { title: 'AC Service', description: 'AC gas refill and filter cleaning', status: 'COMPLETED', technician: 'Ali Ahmed', estimatedTimeHours: 2, amount: 5000 },
  { title: 'Tire Replacement', description: 'Replace all 4 tires', status: 'DELIVERED', technician: 'Hassan Ali', estimatedTimeHours: 1, amount: 45000 },
  { title: 'Battery Replacement', description: 'Replace car battery', status: 'COMPLETED', technician: 'Ahmed Khan', estimatedTimeHours: 1, amount: 15000 },
  { title: 'Transmission Service', description: 'Transmission fluid change', status: 'IN_PROGRESS', technician: 'Ali Ahmed', estimatedTimeHours: 2, amount: 10000 },
  { title: 'Wheel Alignment', description: 'Four-wheel alignment', status: 'PENDING', technician: 'Hassan Ali', estimatedTimeHours: 1, amount: 3000 }
];

const invoiceItems = [
  [
    { description: 'Engine Oil (5W-30)', quantity: 4, price: 500 },
    { description: 'Oil Filter', quantity: 1, price: 500 }
  ],
  [
    { description: 'Brake Pads (Front)', quantity: 1, price: 6000 },
    { description: 'Labor', quantity: 2, price: 1000 }
  ],
  [
    { description: 'Spark Plugs', quantity: 4, price: 2000 },
    { description: 'Air Filter', quantity: 1, price: 1500 },
    { description: 'Labor', quantity: 3, price: 8500 }
  ],
  [
    { description: 'AC Gas Refill', quantity: 1, price: 3000 },
    { description: 'AC Filter', quantity: 1, price: 2000 }
  ],
  [
    { description: 'Tires (Set of 4)', quantity: 4, price: 10000 },
    { description: 'Installation', quantity: 1, price: 5000 }
  ],
  [
    { description: 'Car Battery', quantity: 1, price: 12000 },
    { description: 'Installation', quantity: 1, price: 3000 }
  ]
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Customer.deleteMany({});
    await Vehicle.deleteMany({});
    await Job.deleteMany({});
    await Invoice.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create customers
    console.log('👥 Creating customers...');
    const customers = await Customer.insertMany(customersData);
    console.log(`✅ Created ${customers.length} customers\n`);

    // Create vehicles
    console.log('🚗 Creating vehicles...');
    const vehicles = [];
    for (let i = 0; i < vehiclesData.length; i++) {
      const vehicleData = {
        ...vehiclesData[i],
        customer: customers[i % customers.length]._id,
        status: 'Active',
        lastService: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
        nextService: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in next 90 days
      };
      const vehicle = await Vehicle.create(vehicleData);
      vehicles.push(vehicle);
    }
    console.log(`✅ Created ${vehicles.length} vehicles\n`);

    // Create jobs
    console.log('🔧 Creating jobs...');
    const jobs = [];
    for (let i = 0; i < jobsData.length; i++) {
      const customer = customers[i % customers.length];
      const vehicle = vehicles[i % vehicles.length];
      const jobData = {
        ...jobsData[i],
        customer: customer._id,
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          plateNo: vehicle.plateNo
        },
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
      };
      const job = await Job.create(jobData);
      jobs.push(job);
    }
    console.log(`✅ Created ${jobs.length} jobs\n`);

    // Create invoices
    console.log('📄 Creating invoices...');
    const invoices = [];
    for (let i = 0; i < Math.min(jobs.length, invoiceItems.length); i++) {
      const job = jobs[i];
      const customer = customers.find(c => c._id.equals(job.customer));
      const vehicle = vehicles.find(v => v.customer.equals(job.customer));
      
      const items = invoiceItems[i % invoiceItems.length];
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.15; // 15% tax
      const amount = subtotal + tax;

      const invoiceData = {
        customer: customer._id,
        job: job._id,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          plateNo: vehicle.plateNo
        },
        items: items,
        subtotal: subtotal,
        tax: tax,
        discount: 0,
        amount: amount,
        status: job.status === 'COMPLETED' || job.status === 'DELIVERED' ? 'Paid' : 'Pending',
        paymentMethod: job.status === 'COMPLETED' || job.status === 'DELIVERED' ? 'Cash' : undefined,
        technician: job.technician
      };
      const invoice = await Invoice.create(invoiceData);
      invoices.push(invoice);
    }
    console.log(`✅ Created ${invoices.length} invoices\n`);

    // Create a test admin user (if doesn't exist)
    console.log('👤 Creating test admin user...');
    const existingUser = await User.findOne({ email: 'admin@momentum.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@momentum.com',
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });
      console.log('✅ Created admin user: admin@momentum.com / admin123\n');
    } else {
      console.log('ℹ️  Admin user already exists\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   👥 Customers: ${customers.length}`);
    console.log(`   🚗 Vehicles: ${vehicles.length}`);
    console.log(`   🔧 Jobs: ${jobs.length}`);
    console.log(`   📄 Invoices: ${invoices.length}`);
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

