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

3. **Configure Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     - `MONGODB_URI` - Your MongoDB Atlas connection string
     - `JWT_SECRET` - Your JWT secret key
     - `FRONTEND_URL` - Your frontend URL (e.g., https://your-frontend.vercel.app)
     - `EMAIL_USER` - (Optional) Email service user
     - `EMAIL_PASSWORD` - (Optional) Email service password
     - `NODE_ENV` - Set to `production`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your backend

## Important Notes

- The entry point is `api/index.js` (configured in vercel.json)
- MongoDB connection is handled automatically on each serverless function invocation
- Make sure your MongoDB Atlas IP whitelist includes Vercel's IP ranges (or use 0.0.0.0/0 for development)
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

