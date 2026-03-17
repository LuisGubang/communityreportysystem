# Community Reporting System - Backend Setup

This directory contains the Node.js/Express backend for the Community Reporting System.

## Project Structure

```
backend/
├── server.js              # Main server file
├── .env                   # Environment variables
├── package.json          # Dependencies
├── config/
│   └── database.js       # Database configuration
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── reports.js       # Report routes
│   ├── users.js         # User management routes
│   └── notifications.js # Notification routes
├── controllers/
│   ├── authController.js
│   ├── reportController.js
│   ├── userController.js
│   └── notificationController.js
├── models/
│   ├── User.js
│   ├── Report.js
│   └── Notification.js
├── middleware/
│   ├── auth.js          # JWT authentication middleware
│   └── errorHandler.js  # Error handling middleware
├── utils/
│   ├── jwt.js           # JWT utilities
│   ├── validators.js    # Input validation
│   └── mailer.js        # Email sending utility
└── tests/
    └── api.test.js      # API tests
```

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn
- PostgreSQL (or MongoDB for media/logs)
- Redis (optional, for caching)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Create `.env` file with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=community_reporting_db

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Email Configuration (SMTP/SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDGRID_API_KEY=your_sendgrid_key

# SMS Configuration (Twilio/Africa's Talking)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE=+1234567890
AFRICAS_TALKING_API_KEY=your_africas_talking_key

# Firebase/Push Notifications (FCM)
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_PRIVATE_KEY=your_firebase_key
FIREBASE_CLIENT_EMAIL=your_firebase_email

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=community-reports

# Cors & Security
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Database Setup

#### For PostgreSQL:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE community_reporting_db;"

# Run migrations (when available)
npm run migrate:latest
```

#### For MongoDB:

```bash
# Connect to MongoDB Atlas or local instance
# Connection string in .env: MONGO_URI=mongodb://localhost:27017/community_reporting
```

### Step 4: Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication Routes
```
POST   /api/auth/register      - User registration
POST   /api/auth/login         - User login
POST   /api/auth/refresh       - Refresh JWT token
POST   /api/auth/logout        - User logout
GET    /api/auth/verify        - Verify token
```

### Report Routes
```
GET    /api/reports            - List all reports (admin)
GET    /api/reports/:id        - Get report details
POST   /api/reports            - Submit new report
PUT    /api/reports/:id        - Update report status (admin)
DELETE /api/reports/:id        - Delete report (admin)
GET    /api/reports/user/:uid  - Get user's reports
POST   /api/reports/:id/verify - Verify report (admin)
```

### User Routes
```
GET    /api/users              - List all users (admin)
GET    /api/users/:id          - Get user profile
PUT    /api/users/:id          - Update user profile
DELETE /api/users/:id          - Delete user (admin)
PATCH  /api/users/:id/status   - Update user status (admin)
GET    /api/users/:id/reports  - Get user's reports
```

### Notification Routes
```
GET    /api/notifications      - Get user notifications
POST   /api/notifications/send - Send notification
POST   /api/notifications/:id/read - Mark as read
DELETE /api/notifications/:id  - Delete notification
```

## Features Implementation

### 1. JWT Authentication
- Secure token-based authentication
- Refresh token mechanism
- Role-based access control (RBAC)

### 2. Report Management
- CRUD operations for reports
- Report status workflow (submitted → under-review → resolved)
- Report filtering and search
- Location tracking with coordinates

### 3. Notifications
- **Email**: SMTP/SendGrid integration
- **SMS**: Twilio/Africa's Talking API
- **Push**: Firebase Cloud Messaging (FCM)
- Real-time notification queuing

### 4. Security
- Password hashing (bcrypt)
- Rate limiting to prevent fake reports
- Request validation & sanitization
- HTTPS & CORS configuration
- Audit logging

### 5. File Upload
- AWS S3 integration for photos
- Base64 encoding alternative
- File size validation
- Format validation (jpg, png, gif)

### 6. Database
- PostgreSQL for main data (users, reports, metadata)
- MongoDB for media files and logs
- Database migration system

### 7. Error Handling
- Global error handler
- Standardized error responses
- Request validation
- Try-catch blocks

## Testing

Run the test suite:

```bash
npm test
```

## Docker Deployment (Bonus)

### Build Docker Image
```bash
docker build -t community-reporting-system .
```

### Run Container
```bash
docker run -p 5000:5000 \
  -e DB_HOST=db \
  -e JWT_SECRET=your_secret \
  community-reporting-system
```

### Docker Compose
```bash
docker-compose up
```

## Production Deployment

### 1. AWS Deployment
```bash
# Using Elastic Beanstalk
eb init
eb create production-env
eb deploy
```

### 2. Heroku Deployment
```bash
heroku create community-reporting-api
git push heroku main
```

### 3. Azure Deployment
```bash
az group create --name community-reports --location eastus
az appservice plan create --name community-plan --resource-group community-reports
az webapp create --resource-group community-reports --plan community-plan --name community-reporting-api --runtime "node|16"
```

## Important Security Notes

1. **Never commit .env file** to version control
2. Use HTTPS in production
3. Implement rate limiting
4. Validate all user inputs
5. Use parameterized queries (prevent SQL injection)
6. Enable CORS only for trusted domains
7. Keep dependencies updated: `npm audit fix`
8. Use environment variables for all sensitive data
9. Implement comprehensive logging
10. Regular security audits

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Create user if needed
sudo -u postgres createuser your_user
```

### JWT Token Issues
- Ensure JWT_SECRET is set in .env
- Check token expiration time
- Verify token format in Authorization header

### Email/SMS Not Sending
- Verify API keys in .env
- Check email/phone number validation
- Review rate limiting settings
- Check service quotas

## Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Submit Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For support, email support@communityreporting.dev or create an issue in the repository.
