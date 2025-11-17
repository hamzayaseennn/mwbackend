#!/usr/bin/env node

/**
 * API Test Runner for Railway Backend
 * 
 * Usage:
 * 1. Update test/config.json with your Railway BASE_URL
 * 2. Run: npm run test:api
 * 
 * Requirements:
 * - Node.js 18+ (for native fetch support)
 * 
 * The script will:
 * - Test health check
 * - Test signup-admin
 * - Test login
 * - Test /me endpoint
 * - Test customer creation
 * - Test customer fetching
 * - Test job creation
 * - Test dashboard summary
 */

const fs = require('fs');
const path = require('path');

// Check Node.js version (fetch requires Node 18+)
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.error('❌ Error: Node.js 18+ is required for this test script (fetch API)');
  console.error(`   Current version: ${nodeVersion}`);
  console.error('   Please upgrade Node.js: https://nodejs.org/');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Load config
const configPath = path.join(__dirname, 'config.json');
let config;

try {
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configFile);
} catch (error) {
  console.error(`${colors.red}❌ Error loading config.json:${colors.reset}`, error.message);
  console.error(`${colors.yellow}💡 Make sure test/config.json exists with BASE_URL${colors.reset}`);
  process.exit(1);
}

const BASE_URL = config.BASE_URL;
const testUser = config.testUser;

if (!BASE_URL || BASE_URL.includes('your-railway-app')) {
  console.error(`${colors.red}❌ Please set BASE_URL in test/config.json${colors.reset}`);
  console.error(`${colors.yellow}💡 Example: "BASE_URL": "https://momentum-pos-production.up.railway.app"${colors.reset}`);
  process.exit(1);
}

let authToken = config.TOKEN || '';
let createdCustomerId = null;
let createdJobId = null;

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      error: error.message,
      data: {},
    };
  }
}

// Test functions
async function testSignupAdmin() {
  console.log(`${colors.cyan}📝 Testing: Signup Admin...${colors.reset}`);
  
  const result = await apiRequest('/api/auth/signup-admin', {
    method: 'POST',
    body: JSON.stringify({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      role: 'admin',
    }),
    skipAuth: true,
  });

  if (result.ok && result.data.success) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Signup Admin: ${result.data.message || 'Admin created'}`);
    return true;
  } else {
    // If user already exists, that's okay
    if (result.status === 400 && result.data.error?.includes('already exists')) {
      console.log(`${colors.yellow}⚠️  SKIP${colors.reset} - Admin already exists (this is OK)`);
      return true;
    }
    console.log(`${colors.red}❌ FAIL${colors.reset} - Signup Admin: ${result.data.error || result.data.message || result.statusText}`);
    return false;
  }
}

async function testLogin() {
  console.log(`${colors.cyan}📝 Testing: Login...${colors.reset}`);
  
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
    skipAuth: true,
  });

  if (result.ok && result.data.success && result.data.accessToken) {
    authToken = result.data.accessToken;
    console.log(`${colors.green}✅ PASS${colors.reset} - Login: Token received`);
    console.log(`${colors.blue}   Token: ${authToken.substring(0, 20)}...${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Login: ${result.data.error || result.data.message || result.statusText}`);
    return false;
  }
}

async function testGetMe() {
  console.log(`${colors.cyan}📝 Testing: Get Current User (/me)...${colors.reset}`);
  
  const result = await apiRequest('/api/auth/me');

  if (result.ok && result.data.success && result.data.user) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Get /me: User data retrieved`);
    console.log(`${colors.blue}   User: ${result.data.user.name} (${result.data.user.email})${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Get /me: ${result.data.error || result.data.message || result.statusText}`);
    return false;
  }
}

async function testCreateCustomer() {
  console.log(`${colors.cyan}📝 Testing: Create Customer...${colors.reset}`);
  
  const result = await apiRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Customer',
      phone: '+92 300 1234567',
      email: 'testcustomer@example.com',
      address: '123 Test Street',
      notes: 'Created by API test',
    }),
  });

  if (result.ok && result.data.success && result.data.data) {
    createdCustomerId = result.data.data._id || result.data.data.id;
    console.log(`${colors.green}✅ PASS${colors.reset} - Create Customer: Customer created`);
    console.log(`${colors.blue}   Customer ID: ${createdCustomerId}${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Create Customer: ${result.data.error || result.data.message || result.statusText}`);
    return false;
  }
}

async function testGetCustomers() {
  console.log(`${colors.cyan}📝 Testing: Get All Customers...${colors.reset}`);
  
  const result = await apiRequest('/api/customers');

  if (result.ok && result.data.success && Array.isArray(result.data.data)) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Get Customers: ${result.data.count || result.data.data.length} customers found`);
    return true;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Get Customers: ${result.data.error || result.data.message || result.statusText}`);
    return false;
  }
}

async function testCreateJob() {
  console.log(`${colors.cyan}📝 Testing: Create Job Card...${colors.reset}`);
  
  if (!createdCustomerId) {
    console.log(`${colors.yellow}⚠️  SKIP${colors.reset} - Create Job: No customer ID available`);
    return true;
  }

  const result = await apiRequest('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({
      customer: createdCustomerId,
      vehicle: {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        plateNo: 'TEST-123',
      },
      title: 'Test Job - Oil Change',
      description: 'Created by API test',
      status: 'IN_PROGRESS',
      technician: 'Test Technician',
      estimatedTimeHours: 2,
      amount: 5000,
    }),
  });

  if (result.ok && result.data.success && result.data.data) {
    createdJobId = result.data.data._id || result.data.data.id;
    console.log(`${colors.green}✅ PASS${colors.reset} - Create Job: Job created`);
    console.log(`${colors.blue}   Job ID: ${createdJobId}${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Create Job: ${result.data.error || result.data.message || result.statusText}`);
    return false;
  }
}

async function testDashboardSummary() {
  console.log(`${colors.cyan}📝 Testing: Dashboard Summary...${colors.reset}`);
  
  const result = await apiRequest('/api/dashboard/summary');

  if (result.ok && result.data.success && result.data.data) {
    const summary = result.data.data;
    console.log(`${colors.green}✅ PASS${colors.reset} - Dashboard Summary: Data retrieved`);
    console.log(`${colors.blue}   Today Jobs: ${summary.todayJobs || 0}${colors.reset}`);
    console.log(`${colors.blue}   Total Customers: ${summary.totalCustomers || 0}${colors.reset}`);
    console.log(`${colors.blue}   Today Revenue: ₨${(summary.todayRevenue || 0).toLocaleString()}${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Dashboard Summary: ${result.data.error || result.data.message || result.statusText}`);
    return false;
  }
}

async function testHealthCheck() {
  console.log(`${colors.cyan}📝 Testing: Health Check...${colors.reset}`);
  
  const result = await apiRequest('/health', { skipAuth: true });

  if (result.ok) {
    console.log(`${colors.green}✅ PASS${colors.reset} - Health Check: Server is running`);
    if (result.data.database) {
      console.log(`${colors.blue}   Database: ${result.data.database.status}${colors.reset}`);
    }
    return true;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - Health Check: ${result.error || result.statusText}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 API Test Runner for Railway Backend');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`${colors.reset}`);
  console.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}Test User: ${testUser.email}${colors.reset}`);
  console.log('');

  const results = [];

  // Run tests sequentially
  results.push(await testHealthCheck());
  results.push(await testSignupAdmin());
  results.push(await testLogin());
  
  if (!authToken) {
    console.log(`${colors.red}❌ Cannot continue tests without authentication token${colors.reset}`);
    console.log(`${colors.yellow}💡 Make sure login test passed${colors.reset}`);
    process.exit(1);
  }

  results.push(await testGetMe());
  results.push(await testCreateCustomer());
  results.push(await testGetCustomers());
  results.push(await testCreateJob());
  results.push(await testDashboardSummary());

  // Summary
  console.log('');
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`${colors.reset}`);

  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    console.log(`${colors.green}${colors.bright}✅ All tests passed! (${passed}/${total})${colors.reset}`);
    console.log('');
    console.log(`${colors.green}🎉 Your Railway backend API is working correctly!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Some tests failed: ${passed}/${total} passed${colors.reset}`);
    console.log(`${colors.yellow}💡 Check the errors above and verify your Railway backend is running${colors.reset}`);
  }

  console.log('');
  
  // Save token to config for future use
  if (authToken && authToken !== config.TOKEN) {
    config.TOKEN = authToken;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`${colors.blue}💾 Token saved to test/config.json for future tests${colors.reset}`);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}❌ Unexpected error:${colors.reset}`, error);
  process.exit(1);
});

