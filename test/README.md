# API Testing Setup

This directory contains tools for testing your Railway backend API.

## Files

- `config.json` - Configuration file with BASE_URL and test credentials
- `run-tests.js` - Automated test runner script
- `../api-test.http` - Manual testing file for VSCode REST Client extension

## Quick Start

### 1. Configure Your Railway URL

Edit `test/config.json` and set your Railway backend URL:

```json
{
  "BASE_URL": "https://your-railway-app.up.railway.app",
  "TOKEN": "",
  "testUser": {
    "name": "Test Admin",
    "email": "testadmin@motorworks.pk",
    "password": "Test@12345"
  }
}
```

### 2. Run Automated Tests

```bash
npm run test:api
```

This will:
- Test health check
- Test admin signup
- Test login
- Test authenticated endpoints (customers, jobs, dashboard)
- Show colored pass/fail results
- Save the auth token for future tests

### 3. Manual Testing with VSCode REST Client

1. Install the [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) in VSCode
2. Open `api-test.http`
3. Update the `@BASE_URL` variable at the top
4. Click "Send Request" above any request
5. After login, copy the token and update `@TOKEN` variable

## Requirements

- Node.js 18+ (for native `fetch` support)
- Railway backend deployed and accessible
- Valid MongoDB connection

## Test Coverage

The automated test script covers:
- ✅ Health check
- ✅ Admin signup
- ✅ Login
- ✅ Get current user (/me)
- ✅ Create customer
- ✅ Get all customers
- ✅ Create job card
- ✅ Dashboard summary

## Troubleshooting

### "fetch is not defined"
- Make sure you're using Node.js 18 or higher
- Check: `node --version`

### "Network Error"
- Verify your Railway URL is correct in `config.json`
- Check that your Railway backend is running
- Test the health endpoint: `https://your-railway-url.up.railway.app/health`

### "401 Unauthorized"
- The login test might have failed
- Check that test user credentials are correct
- Try running the tests again (token is saved after first successful login)

### "Cannot find module"
- Make sure you're running from the backend directory
- Run: `cd backend && npm run test:api`

## Example Output

```
═══════════════════════════════════════════════════════
🧪 API Test Runner for Railway Backend
═══════════════════════════════════════════════════════

Base URL: https://momentum-pos-production.up.railway.app
Test User: testadmin@motorworks.pk

📝 Testing: Health Check...
✅ PASS - Health Check: Server is running
   Database: connected
📝 Testing: Signup Admin...
✅ PASS - Signup Admin: Admin created
📝 Testing: Login...
✅ PASS - Login: Token received
   Token: eyJhbGciOiJIUzI1NiIsInR5...
📝 Testing: Get Current User (/me)...
✅ PASS - Get /me: User data retrieved
   User: Test Admin (testadmin@motorworks.pk)
📝 Testing: Create Customer...
✅ PASS - Create Customer: Customer created
   Customer ID: 65a1b2c3d4e5f6g7h8i9j0k1
📝 Testing: Get All Customers...
✅ PASS - Get Customers: 5 customers found
📝 Testing: Create Job Card...
✅ PASS - Create Job: Job created
   Job ID: 65a1b2c3d4e5f6g7h8i9j0k2
📝 Testing: Dashboard Summary...
✅ PASS - Dashboard Summary: Data retrieved
   Today Jobs: 3
   Total Customers: 5
   Today Revenue: ₨15,000

═══════════════════════════════════════════════════════
📊 Test Summary
═══════════════════════════════════════════════════════

✅ All tests passed! (8/8)

🎉 Your Railway backend API is working correctly!

💾 Token saved to test/config.json for future tests
```

