# Momentum POS Backend

Node.js + Express + MongoDB backend API with Socket.IO for real-time updates.

## Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the environment example file and configure it:
```bash
cp .env.example .env
```

3. Edit `.env` and fill in the required variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secret key for JWT token signing (use a strong random string)
   - `PORT` - Server port (default: 5000)
   - `EMAIL_USER` - Your Gmail address (for sending verification emails)
   - `EMAIL_PASSWORD` - Gmail App Password (not your regular password)
   - `EMAIL_FROM` - Sender name and email (e.g., "Momentum AutoWorks <your-email@gmail.com>")

   **Note:** For Gmail, you need to:
   1. Enable 2-Factor Authentication on your Google account
   2. Generate an App Password: https://myaccount.google.com/apppasswords
   3. Use the generated App Password (16 characters) as `EMAIL_PASSWORD`

4. Install dependencies:
```bash
npm install
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## API Examples

### Sign Up (First User)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response will include `requiresVerification: true` and a verification code will be sent to the email.

### Verify Email
```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "code": "123456"
  }'
```

### Resend Verification Code
```bash
curl -X POST http://localhost:5000/api/auth/resend-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response will include a `token` that you can use for authenticated requests.

### Get Customers (Authenticated)
```bash
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Customer (Authenticated)
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com",
    "address": "123 Main St"
  }'
```

### Get Jobs (Authenticated)
```bash
curl http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Dashboard Summary (Authenticated)
```bash
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user (first user = admin). Returns `requiresVerification: true` and sends verification code via email.
- `POST /api/auth/login` - Login and get JWT token (requires verified email)
- `POST /api/auth/verify-email` - Verify email with 6-digit code
- `POST /api/auth/resend-code` - Resend verification code to email
- `GET /api/auth/me` - Get current user info

### Customers
- `GET /api/customers` - List all customers (optional `?search=` query)
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Soft delete customer

### Jobs
- `GET /api/jobs` - List all jobs (optional `?status=` filter)
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard statistics

## Socket.IO

The server also runs Socket.IO for real-time updates. Connect to the same URL and listen for `jobUpdated` events.

## Scripts

- `npm run dev` - Start development server with nodemon (auto-restart)
- `npm start` - Start production server

