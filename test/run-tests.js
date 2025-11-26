const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config;

try {
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configFile);
} catch (error) {
  console.error(`${colors.red}❌ Error loading config.json:${colors.reset}`, error.message);
  console.log(`${colors.yellow}Please create test/config.json with BASE_URL and TOKEN${colors.reset}`);
  process.exit(1);
}

const BASE_URL = config.BASE_URL;
let TOKEN = config.TOKEN;

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make API requests
async function makeRequest(method, endpoint, body = null, useToken = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (useToken && TOKEN) {
    options.headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
}

// Test function
async function test(name, testFn) {
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`${colors.green}✅ ${name}${colors.reset}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`${colors.red}❌ ${name}${colors.reset}`);
    console.log(`${colors.red}   Error: ${error.message}${colors.reset}`);
  }
}

// Main test suite
async function runTests() {
  console.log(`${colors.cyan}${colors.bright}========================================`);
  console.log('🧪 Testing Momentum POS API');
  console.log(`========================================${colors.reset}\n`);
  console.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}\n`);

  // Test 1: Signup
  await test('Signup Admin', async () => {
    const response = await makeRequest('POST', '/api/auth/signup', {
      name: 'Test Admin',
      email: `test-admin-${Date.now()}@example.com`,
      password: 'Test123!',
      role: 'admin'
    });

    if (!response.success) {
      if (response.data?.error === 'User already exists') {
        throw new Error('User already exists (this is OK if running multiple times)');
      }
      throw new Error(`Signup failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
    }

    if (!response.data.success) {
      throw new Error(`Signup failed: ${response.data.error || response.data.message}`);
    }
  });

  // Test 2: Login
  let loginEmail = `test-admin-${Date.now()}@example.com`;
  await test('Login', async () => {
    // Try with a test email, if it fails, use the one from config or a default
    const testEmail = config.TEST_EMAIL || loginEmail;
    const testPassword = config.TEST_PASSWORD || 'Test123!';

    const response = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });

    if (!response.success || !response.data.success) {
      throw new Error(`Login failed: ${response.data?.error || response.data?.message || 'Check credentials in config.json'}`);
    }

    if (!response.data.accessToken) {
      throw new Error('No access token received');
    }

    TOKEN = response.data.accessToken;
    console.log(`${colors.yellow}   Token saved for subsequent requests${colors.reset}`);
  });

  // Test 3: Get Me
  await test('Get /me', async () => {
    const response = await makeRequest('GET', '/api/auth/me', null, true);

    if (!response.success || !response.data.success) {
      throw new Error(`Get me failed: ${response.data?.error || response.data?.message || 'Unauthorized'}`);
    }

    if (!response.data.user) {
      throw new Error('No user data returned');
    }
  });

  // Test 4: Create Customer
  let customerId;
  await test('Create Customer', async () => {
    const response = await makeRequest('POST', '/api/customers', {
      name: 'Test Customer',
      phone: '+92 331 1234567',
      email: 'testcustomer@example.com',
      address: '123 Test Street, Karachi',
      notes: 'Test customer created by API test'
    }, true);

    if (!response.success || !response.data.success) {
      throw new Error(`Create customer failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
    }

    if (!response.data.data || !response.data.data._id) {
      throw new Error('No customer ID returned');
    }

    customerId = response.data.data._id;
    console.log(`${colors.yellow}   Customer ID: ${customerId}${colors.reset}`);
  });

  // Test 5: Get All Customers
  await test('Get All Customers', async () => {
    const response = await makeRequest('GET', '/api/customers', null, true);

    if (!response.success || !response.data.success) {
      throw new Error(`Get customers failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
    }

    if (!Array.isArray(response.data.data)) {
      throw new Error('Customers data is not an array');
    }

    console.log(`${colors.yellow}   Found ${response.data.count || response.data.data.length} customers${colors.reset}`);
  });

  // Test 6: Get Customer by ID
  if (customerId) {
    await test('Get Customer by ID', async () => {
      const response = await makeRequest('GET', `/api/customers/${customerId}`, null, true);

      if (!response.success || !response.data.success) {
        throw new Error(`Get customer by ID failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
      }

      if (!response.data.data) {
        throw new Error('No customer data returned');
      }
    });
  }

  // Test 7: Update Customer
  if (customerId) {
    await test('Update Customer', async () => {
      const response = await makeRequest('PUT', `/api/customers/${customerId}`, {
        name: 'Test Customer Updated',
        phone: '+92 331 7654321'
      }, true);

      if (!response.success || !response.data.success) {
        throw new Error(`Update customer failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
      }
    });
  }

  // Test 8: Create Job Card
  let jobId;
  if (customerId) {
    await test('Create Job Card', async () => {
      const response = await makeRequest('POST', '/api/jobs', {
        customer: customerId,
        vehicle: {
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          plateNo: 'TEST-123'
        },
        title: 'Test Service',
        description: 'Test job card created by API test',
        status: 'PENDING',
        technician: 'Test Technician',
        estimatedTimeHours: 2,
        amount: 5000
      }, true);

      if (!response.success || !response.data.success) {
        throw new Error(`Create job failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
      }

      if (!response.data.data || !response.data.data._id) {
        throw new Error('No job ID returned');
      }

      jobId = response.data.data._id;
      console.log(`${colors.yellow}   Job ID: ${jobId}${colors.reset}`);
    });
  }

  // Test 9: Get All Jobs
  await test('Get All Jobs', async () => {
    const response = await makeRequest('GET', '/api/jobs', null, true);

    if (!response.success || !response.data.success) {
      throw new Error(`Get jobs failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
    }

    if (!Array.isArray(response.data.data)) {
      throw new Error('Jobs data is not an array');
    }

    console.log(`${colors.yellow}   Found ${response.data.count || response.data.data.length} jobs${colors.reset}`);
  });

  // Test 10: Update Job
  if (jobId) {
    await test('Update Job', async () => {
      const response = await makeRequest('PUT', `/api/jobs/${jobId}`, {
        status: 'IN_PROGRESS',
        amount: 5500
      }, true);

      if (!response.success || !response.data.success) {
        throw new Error(`Update job failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
      }
    });
  }

  // Test 11: Get Dashboard Summary
  await test('Get Dashboard Summary', async () => {
    const response = await makeRequest('GET', '/api/dashboard/summary', null, true);

    if (!response.success || !response.data.success) {
      throw new Error(`Get dashboard summary failed: ${response.data?.error || response.data?.message || 'Unknown error'}`);
    }

    if (!response.data.data) {
      throw new Error('No dashboard data returned');
    }

    console.log(`${colors.yellow}   Today's Jobs: ${response.data.data.todayJobs || 0}`);
    console.log(`${colors.yellow}   Today's Revenue: ${response.data.data.todayRevenue || 0}${colors.reset}`);
  });

  // Print summary
  console.log(`\n${colors.cyan}${colors.bright}========================================`);
  console.log('📊 Test Summary');
  console.log(`========================================${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  if (results.failed > 0) {
    console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  }
  console.log(`${colors.blue}Total: ${results.passed + results.failed}${colors.reset}\n`);

  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bright}🎉 All API checks passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}⚠️  Some tests failed. Please check the errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error(`${colors.red}❌ Error: fetch is not available.${colors.reset}`);
  console.log(`${colors.yellow}Please use Node.js 18+ or install node-fetch${colors.reset}`);
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}${colors.bright}❌ Fatal error:${colors.reset}`, error);
  process.exit(1);
});


