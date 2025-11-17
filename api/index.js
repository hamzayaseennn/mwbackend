// Vercel serverless function entry point
require('dotenv').config();

// Set VERCEL environment variable for app.js to detect
process.env.VERCEL = '1';

const app = require('../src/app');

// Export the Express app as a serverless function
// Vercel expects the handler to be exported
module.exports = app;

