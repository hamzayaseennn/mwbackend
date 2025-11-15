# Railway Deployment Guide

## Environment Variables

Set these environment variables in your Railway project settings:

### Required Variables

1. **MONGODB_URI** - Your MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - Get this from MongoDB Atlas or your MongoDB provider

2. **JWT_SECRET** - Secret key for JWT token signing
   - Generate a strong random string (at least 32 characters)
   - Example: `openssl rand -base64 32`

3. **JWT_ACCESS_SECRET** - Secret key for access tokens (optional, defaults to JWT_SECRET)
   - Generate a strong random string

4. **JWT_REFRESH_SECRET** - Secret key for refresh tokens (optional, defaults to JWT_SECRET)
   - Generate a strong random string

### Optional Variables

5. **PORT** - Server port (Railway automatically sets this, don't override unless needed)
   - Default: Railway will provide this automatically

6. **NODE_ENV** - Environment mode
   - Set to `production` for production deployments

7. **FRONTEND_URL** - Frontend application URL
   - Example: `https://your-frontend.vercel.app` or `http://localhost:5173` for local dev

8. **EMAIL_USER** - Email address for sending emails (Gmail)
   - Example: `your-email@gmail.com`

9. **EMAIL_PASSWORD** - Gmail App Password (not your regular password)
   - Generate from: https://myaccount.google.com/apppasswords

10. **EMAIL_FROM** - Sender name and email
    - Example: `Momentum POS <your-email@gmail.com>`

11. **TWILIO_ACCOUNT_SID** - Twilio Account SID (for WhatsApp)
    - Get from: https://www.twilio.com/console

12. **TWILIO_AUTH_TOKEN** - Twilio Auth Token (for WhatsApp)
    - Get from: https://www.twilio.com/console

13. **TWILIO_WHATSAPP_FROM** - Twilio WhatsApp number
    - Format: `whatsapp:+14155238886`

## Setting Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add each variable with its value
6. Click "Deploy" to apply changes

## Important Notes

- **MONGODB_URI is REQUIRED** - The app will not start without it
- Make sure your MongoDB Atlas IP whitelist includes Railway's IP ranges (or use 0.0.0.0/0 for all)
- JWT secrets should be different for production
- Never commit `.env` files to git

## Troubleshooting

### MongoDB Connection Error
- Verify `MONGODB_URI` is set correctly in Railway
- Check MongoDB Atlas network access settings
- Ensure the connection string is properly URL-encoded

### Port Issues
- Railway automatically sets the `PORT` variable
- Don't hardcode port numbers in your code
- The server will use `process.env.PORT` which Railway provides

