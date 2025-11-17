# Railway Deployment Guide

## Prerequisites
- MongoDB Atlas account with connection string
- Railway account
- GitHub repository with backend code

## Deployment Steps

1. **Push your code to GitHub** (already done)

2. **Create a new project on Railway:**
   - Go to https://railway.app
   - Sign in with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository (mwbackend)
   - Railway will auto-detect the backend folder

3. **Configure Environment Variables in Railway:**
   - Go to your project → Variables tab
   - Add the following variables:
     - `MONGODB_URI` - Your MongoDB Atlas connection string
       - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`
       - If password contains `@`, encode it as `%40`
       - Example: `mongodb+srv://momentum:Qwerty%4012345@cluster0.kkywdqf.mongodb.net/momentum-pos?appName=Cluster0&retryWrites=true&w=majority`
     - `JWT_SECRET` - Your JWT secret key (generate a strong random string)
     - `FRONTEND_URL` - Set to `https://www.motorworks.pk` (production frontend domain)
     - `NODE_ENV` - Set to `production`
     - `PORT` - Railway will set this automatically, but you can set it if needed
     - `EMAIL_USER` - (Optional) Email service user
     - `EMAIL_PASSWORD` - (Optional) Email service password

4. **Configure MongoDB Atlas Network Access:**
   - Go to https://cloud.mongodb.com/
   - Navigate to your cluster → "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or enter `0.0.0.0/0`)
   - Click "Confirm"
   - ⚠️ **This is required because Railway uses dynamic IP addresses**

5. **Deploy:**
   - Railway will automatically detect the `Procfile` and deploy
   - The deployment will start automatically
   - Check the deployment logs for any errors

6. **Set up Custom Domain (Optional):**
   - Go to your Railway project → Settings → Domains
   - Add your custom domain
   - Follow Railway's DNS instructions to point your domain

## Important Notes

- The entry point is `server.js` (configured in Procfile)
- MongoDB connection is handled on server startup
- Railway automatically sets the `PORT` environment variable
- The server listens on the port provided by Railway
- Socket.IO will work normally on Railway (unlike serverless platforms)

## File Structure
```
backend/
├── server.js              # Main server entry point
├── Procfile              # Railway process file
├── railway.json          # Railway configuration
├── src/
│   ├── app.js            # Express app
│   ├── config/
│   ├── controllers/
│   ├── models/
│   └── routes/
└── package.json
```

## Troubleshooting

### MongoDB Connection Errors:
1. **Verify MONGODB_URI in Railway:**
   - Go to Project → Variables
   - Ensure `MONGODB_URI` is set correctly
   - Check that special characters are URL-encoded

2. **Check MongoDB Atlas Network Access:**
   - Ensure `0.0.0.0/0` is whitelisted (allows all IPs)
   - This is necessary for Railway's dynamic IPs

3. **Verify Database User:**
   - Go to MongoDB Atlas → Database Access
   - Ensure your user has read/write permissions

### Port Issues:
- Railway automatically sets the `PORT` environment variable
- Your `server.js` uses `process.env.PORT || 5000`
- This should work automatically

### Build Errors:
- Check Railway deployment logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

## Testing

After deployment:
1. Visit your Railway deployment URL (provided by Railway)
2. Test health endpoint: `https://your-backend.railway.app/health`
3. Test database: `https://your-backend.railway.app/api/test-db`
4. Update your frontend API URL to point to the Railway backend

