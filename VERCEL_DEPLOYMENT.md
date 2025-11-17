# Vercel Deployment Guide

## Prerequisites
- MongoDB Atlas account with connection string
- Vercel account

## Deployment Steps

1. **Push your code to GitHub** (already done)

2. **Import project to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository (mwbackend)
   - Select the `backend` folder as the root directory

3. **Configure MongoDB Atlas Network Access (CRITICAL):**
   - Go to https://cloud.mongodb.com/
   - Navigate to your cluster → "Network Access"
   - Click "Add IP Address"
   - **IMPORTANT:** Click "Allow Access from Anywhere" or enter `0.0.0.0/0`
   - Click "Confirm"
   - ⚠️ **This is required because Vercel uses dynamic IP addresses that change frequently**

4. **Configure Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     - `MONGODB_URI` - Your MongoDB Atlas connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/database`)
     - `JWT_SECRET` - Your JWT secret key (generate a strong random string)
     - `FRONTEND_URL` - Set to `https://www.motorworks.pk` (production frontend domain)
     - `EMAIL_USER` - (Optional) Email service user
     - `EMAIL_PASSWORD` - (Optional) Email service password
     - `NODE_ENV` - Set to `production`
   - ⚠️ **Make sure MONGODB_URI is correctly formatted and URL-encoded (use %40 for @ in password)**

5. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your backend
   - Check the deployment logs for any errors

## Troubleshooting

### MongoDB Connection Errors:
1. **Verify MONGODB_URI in Vercel:**
   - Go to Project Settings → Environment Variables
   - Ensure `MONGODB_URI` is set correctly
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - If password contains special characters, URL-encode them (e.g., `@` becomes `%40`)

2. **Check MongoDB Atlas Network Access:**
   - Ensure `0.0.0.0/0` is whitelisted (allows all IPs)
   - This is necessary for Vercel's dynamic IPs

3. **Verify Database User:**
   - Go to MongoDB Atlas → Database Access
   - Ensure your user has read/write permissions
   - Check username and password match your connection string

4. **Test Connection:**
   - Visit `https://your-backend.vercel.app/health` to check server status
   - Visit `https://your-backend.vercel.app/api/test-db` to test database connection

### 404 Errors:
- Ensure all routes are prefixed with `/api/` (e.g., `/api/auth/login`)
- Root route `/` should return API information
- Health check available at `/health`

## Important Notes

- The entry point is `api/index.js` (configured in vercel.json)
- MongoDB connection is handled automatically on each serverless function invocation
- Connection is reused across requests within the same serverless function instance
- Socket.IO may not work perfectly on Vercel serverless functions (consider alternatives for real-time features)

## File Structure
```
backend/
├── api/
│   └── index.js          # Vercel serverless function entry point
├── src/
│   ├── app.js            # Express app
│   ├── config/
│   ├── controllers/
│   ├── models/
│   └── routes/
├── vercel.json           # Vercel configuration
└── package.json
```

