# Community Reporting System

A comprehensive, production-ready platform for citizens to report community incidents (crime, disasters, infrastructure issues, etc.) with real-time admin dashboard, location tracking, and multi-channel notifications.

**Status:** ✅ Production Ready | **Latest Version:** 1.0.0

## 🌟 Key Features

### For Citizens/Users
- ✅ **Anonymous Reporting** - Submit reports without revealing identity
- ✅ **Location Tracking** - Pin incident location on interactive map (Leaflet.js)
- ✅ **Multi-Media Support** - Attach photos and documents
- ✅ **Report Tracking** - Monitor status from submission to resolution
- ✅ **Push Notifications** - Real-time updates via SMS, Email, or Push
- ✅ **Rate Limiting** - Prevent spam and fake reports
- ✅ **User Dashboard** - View personal reports and statistics

### For Administrators
- ✅ **Admin Dashboard** - Comprehensive analytics and reporting
- ✅ **Report Management** - Review, verify, and update report status
- ✅ **Location Map** - Visualize all reports on interactive map
- ✅ **User Management** - Manage users and permissions
- ✅ **Bulk Notifications** - Send alerts to multiple users
- ✅ **Analytics** - Daily reports, resolution times, geographic distribution
- ✅ **System Settings** - Configure system parameters
- ✅ **Audit Logs** - Track all user actions

## 🏗️ Architecture

### Tech Stack

**Frontend**
- HTML5, CSS3, JavaScript (Vanilla)
- Leaflet.js - Interactive maps
- Chart.js - Analytics and data visualization
- Responsive design (Mobile-first)

**Backend**
- Node.js + Express.js
- RESTful API with JWT Authentication
- Rate limiting & Input validation

**Database**
- PostgreSQL - Main data (users, reports, metadata)
- MongoDB - Media files and audit logs
- Redis - Caching (optional)

**Notifications**
- Email: SMTP / SendGrid
- SMS: Twilio / Africa's Talking
- Push: Firebase Cloud Messaging (FCM)

**Hosting & DevOps**
- Docker & Docker Compose
- AWS / Azure / Firebase deployment
- HTTPS & SSL/TLS encryption
- Role-Based Access Control (RBAC)

## 📁 Project Structure

```
community-reporting-system/
├── frontend/
│   ├── index.html                 # Home page
│   ├── login.html                 # Login with role selection
│   ├── register.html              # Registration form
│   ├── user-dashboard.html        # Citizen dashboard
│   ├── admin-dashboard.html       # Admin dashboard
│   ├── css/
│   │   └── style.css              # All styles
│   ├── js/
│   │   ├── main.js                # Core authentication & logic
│   │   ├── user-dashboard.js      # User dashboard specific
│   │   └── admin-dashboard.js     # Admin dashboard specific
│   └── assets/images/
│
├── backend/
│   ├── server.js                  # Express server
│   ├── package.json               # Dependencies
│   ├── .env.example               # Environment template
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── reports.js             # Report CRUD endpoints
│   │   ├── users.js               # User management
│   │   └── notifications.js       # Notification endpoints
│   ├── middleware/
│   │   └── auth.js                # JWT authentication
│   ├── utils/
│   │   └── logger.js              # Logging utility
│   └── tests/
│       └── api.test.js
│
├── docker-compose.yml             # Docker services
├── Dockerfile                      # Docker build
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- npm or yarn
- PostgreSQL 12+
- Docker (optional)

### 1. Frontend Setup

The frontend is ready to use! No build step needed - it's vanilla HTML/CSS/JS.

**For local testing:**
```bash
# Install a simple HTTP server
npm install -g http-server

# Serve the frontend
cd community-reporting-system
http-server -p 3000
```

**Access at:** http://localhost:3000

**Demo Credentials:**
- **User:** user@test.com / password123
- **Admin:** admin@test.com / admin123

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

**API runs at:** http://localhost:5000

### 3. Docker Deployment (Optional)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Services:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - PostgreSQL: localhost:5432
# - MongoDB: localhost:27017
```

## 📚 API Documentation

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - User login
POST   /api/auth/refresh     - Refresh JWT token
GET    /api/auth/verify      - Verify current token
```

### Reports
```
GET    /api/reports          - List reports
GET    /api/reports/:id      - Get report details
POST   /api/reports          - Submit new report
PUT    /api/reports/:id      - Update report status (admin)
DELETE /api/reports/:id      - Delete report (admin)
POST   /api/reports/:id/verify - Verify/upvote report
```

### Users (Admin Only)
```
GET    /api/users            - List all users
GET    /api/users/:id        - Get user profile
PUT    /api/users/:id        - Update profile
DELETE /api/users/:id        - Delete user
PATCH  /api/users/:id/status - Change user status
```

### Notifications
```
GET    /api/notifications    - Get user notifications
POST   /api/notifications/send - Send notification (admin)
PATCH  /api/notifications/:id/read - Mark as read
DELETE /api/notifications/:id - Delete notification
```

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth with refresh tokens
- ✅ **Password Hashing** - bcrypt with configurable rounds
- ✅ **Rate Limiting** - Prevent brute force and spam
- ✅ **CORS Protection** - Whitelist trusted domains
- ✅ **Input Validation** - Sanitize all user inputs
- ✅ **Role-Based Access Control** - Citizen vs Admin roles
- ✅ **HTTPS/SSL** - Encrypted communication
- ✅ **Audit Logging** - Track all critical actions
- ✅ **Error Handling** - Secure error responses

## 📊 Key Use Cases

1. **Urban Crime Reporting** - Citizens report criminal activities to authorities
2. **Flood Warnings** - Real-time flood/disaster alerts with location tracking
3. **Fire Outbreak Response** - Quick fire incident reporting and response coordination
4. **Road Accident Coordination** - Emergency responders coordinate at accident scenes
5. **University Campus Safety** - Campus security monitors student-reported incidents
6. **County Disaster Management** - Local government tracks disasters for response

## 🌍 Impact & Relevance

- ⚡ **Faster Emergency Response** - Reduced response time from hours to minutes
- 📈 **Data-Driven Planning** - Geographic heat maps for urban planning
- 🤝 **Improved Public Trust** - Transparent incident handling
- 🏙️ **Smart Cities** - Supports SDG 11 (Sustainable Cities & Communities)
- 🔒 **Public Safety** - Enhanced community security and disaster management
- 🌏 **Perfect for Africa** - Designed for African urban contexts with local payment options

## 🛠️ Configuration Guide

### Email Setup (SendGrid)
```env
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### SMS Setup (Twilio)
```env
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE=+1234567890
```

### SMS Setup (Africa's Talking)
```env
AFRICAS_TALKING_API_KEY=xxxxx
AFRICAS_TALKING_USERNAME=username
```

### Push Notifications (Firebase)
```env
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_PRIVATE_KEY=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx
```

### Maps (Google Maps API)
```env
GOOGLE_MAPS_API_KEY=xxxxx
```

## 📱 Responsive Design

- ✅ **Mobile-First** approach
- ✅ **Works on tablets** and desktops
- ✅ **Touch-friendly** interface
- ✅ Tested on iOS, Android, and desktop browsers

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Heroku
```bash
git push heroku main
```

### AWS Elastic Beanstalk
```bash
eb init
eb create production-env
eb deploy
```

### Azure App Service
```bash
az webapp create --resource-group myGroup --plan myPlan --name my-app
```

### Firebase Hosting
```bash
firebase deploy
```

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Linux/Mac: Find and kill process
lsof -i :5000
kill -9 <PID>

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Database connection error:**
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check .env database credentials
- Create database: `createdb community_reporting_db`

**JWT token invalid:**
- Ensure JWT_SECRET in .env is set
- Check Authorization header format: `Authorization: Bearer <token>`

## 📝 License

MIT License - Free for personal and commercial use

## 👨‍💻 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -am 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit Pull Request

## 📞 Support

- 📧 Email: support@communityreporting.dev
- 💬 Issues: GitHub Issues
- 📚 Documentation: See ./backend/SETUP.md

## 🎉 Acknowledgments

- Leaflet.js for maps
- Chart.js for analytics
- Express.js for backend
- All contributors and testers

## 🗺️ Roadmap

- [ ] Mobile apps (Flutter/React Native)
- [ ] Advanced ML-based spam detection
- [ ] Integration with real emergency services APIs
- [ ] Multi-language support
- [ ] Video authentication for critical reports
- [ ] Community voting/verification system

---

**Made with ❤️ for safer communities**

Version: 1.0.0 | Last Updated: February 2026
