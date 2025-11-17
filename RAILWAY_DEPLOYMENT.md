# Railway Deployment Guide

## Prerequisites
- MongoDB Atlas account with connection string
- Railway account (sign up at https://railway.app)
- GitHub account with your backend repository

## Deployment Steps

1. **Push your code to GitHub** (already done)

2. **Create a new project on Railway:**
   - Go to https://railway.app
   - Sign in with your GitHub account
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your backend repository (`mwbackend`)

3. **Configure the service:**
   - Railway will automatically detect it's a Node.js project
   - Set the root directory to `backend` (if not already set)
   - The start command is already configured in `package.json` as `npm start`

4. **Add Environment Variables:**
   - Go to your service → Variables tab
   - Add the following environment variables:
     - `MONGODB_URI` - Your MongoDB Atlas connection string
       ```
       mongodb+srv://momentum:Qwerty%4012345@cluster0.kkywdqf.mongodb.net/momentum-pos?appName=Cluster0&retryWrites=true&w=majority
       ```
     - `JWT_SECRET` - Your JWT secret key (use a strong random string)
     - `FRONTEND_URL` - Set to `https://www.motorworks.pk` (your frontend deployed on Vercel)
     - `NODE_ENV` - Set to `production`
     - `EMAIL_USER` - (Optional) Email service user
     - `EMAIL_PASSWORD` - (Optional) Email service password
     - `PORT` - Railway will automatically set this, but you can leave it as default

5. **Configure MongoDB Atlas:**
   - Go to MongoDB Atlas → Network Access
   - Add Railway's IP ranges or use `0.0.0.0/0` for all IPs (for development)
   - For production, you can whitelist specific Railway IPs

6. **Deploy:**
   - Railway will automatically deploy when you push to your main branch
   - Or click "Deploy" in the Railway dashboard
   - Wait for the deployment to complete

7. **Get your backend URL:**
   - After deployment, Railway will provide a public URL
   - Example: `https://your-backend-name.up.railway.app`
   - Copy this URL - you'll need it for your frontend API configuration

8. **Update Frontend API URL:**
   - In your frontend (deployed on Vercel), update the API base URL to your Railway backend URL
   - This is typically in your frontend's environment variables or API client configuration

## Important Notes

- **Entry Point**: `server.js` is the main entry point (configured in `package.json`)
- **Port**: Railway automatically sets the `PORT` environment variable
- **MongoDB Connection**: The connection is established on server startup (handled in `server.js`)
- **CORS**: Already configured to allow requests from `https://www.motorworks.pk`
- **Socket.IO**: Works perfectly on Railway (unlike serverless platforms)
- **Auto-deploy**: Railway automatically deploys on every push to your main branch

## File Structure
```
backend/
├── server.js              # Main entry point (starts Express server)
├── src/
│   ├── app.js             # Express app configuration
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── controllers/
│   ├── models/
│   └── routes/
├── package.json           # Dependencies and scripts
└── README.md
```

## Health Check

After deployment, you can check if your backend is running:
- Health endpoint: `https://your-backend-url.railway.app/health`
- Database test: `https://your-backend-url.railway.app/api/test-db`

## Troubleshooting

1. **Build fails:**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **MongoDB connection fails:**
   - Verify `MONGODB_URI` is set correctly in Railway variables
   - Check MongoDB Atlas Network Access whitelist
   - Ensure MongoDB Atlas user has proper permissions

3. **CORS errors:**
   - Verify `FRONTEND_URL` is set to `https://www.motorworks.pk`
   - Check that your frontend is making requests to the correct backend URL

4. **Port issues:**
   - Railway automatically sets `PORT` - don't hardcode it
   - Use `process.env.PORT || 5000` in your code (already done)

## Custom Domain (Optional)

Railway allows you to add a custom domain:
1. Go to your service → Settings → Domains
2. Add your custom domain
3. Follow the DNS configuration instructions

