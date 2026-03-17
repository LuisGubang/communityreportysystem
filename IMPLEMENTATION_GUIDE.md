# Community Reporting System - Complete Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Feature Walkthrough](#feature-walkthrough)
3. [Role-Based Workflows](#role-based-workflows)
4. [Database Schema](#database-schema)
5. [API Integration](#api-integration)
6. [Security Best Practices](#security-best-practices)
7. [Notification System](#notification-system)
8. [Deployment Checklist](#deployment-checklist)

---

## System Overview

### Architecture Layers

```
┌─────────────────────────────────────┐
│   Frontend (HTML/CSS/JavaScript)    │
│   - User Dashboard                  │
│   - Admin Dashboard                 │
│   - Interactive Maps (Leaflet.js)   │
└────────────────┬────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────┐
│   API Layer (Express.js)            │
│   - Authentication (JWT)            │
│   - CRUD Operations                 │
│   - Rate Limiting                   │
│   - Input Validation                │
└────────────────┬────────────────────┘
                 │
         ┌───────┴─────────┐
         │                 │
┌────────▼────────┐  ┌─────▼──────────┐
│   PostgreSQL    │  │    MongoDB     │
│   (Main Data)   │  │  (Media/Logs)  │
└─────────────────┘  └────────────────┘
```

---

## Feature Walkthrough

### 1. User Registration & Login

**Key Features:**
- Role selection (Citizen or Admin)
- Email-based registration
- Secure password hashing
- JWT token generation

**Frontend Flow:**
1. User visits `/register.html`
2. Selects role (Citizen/Admin)
3. Fills form with required info
4. Backend validates and stores user
5. Redirects to login page

**Code Example:**
```javascript
// Frontend: Register a citizen
const registerData = {
  fullname: "John Doe",
  email: "john@example.com",
  phone: "+234-800-000-0001",
  password: "securePassword123",
  role: "user"
};

fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData)
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('token', data.token);
  window.location.href = 'user-dashboard.html';
});
```

### 2. Report Submission

**Key Features:**
- Multiple incident types (Crime, Flood, Fire, etc.)
- Location tracking with maps
- Photo attachments
- Anonymous reporting option
- Real-time rate limiting

**Workflow:**
1. User logs in and navigates to "New Report"
2. Selects incident type from dropdown
3. Enters title and detailed description
4. Clicks on map to set location (Leaflet)
5. Optionally adds photos
6. Selects anonymous option
7. Submits report
8. Gets notification alert and report ID

**Report Status Lifecycle:**
```
submitted → under-review → resolved
                      ↓
                   rejected
```

**Database Storage:**
```sql
INSERT INTO reports (
  user_id, incident_type, title, description, 
  location, latitude, longitude, anonymous, status
) VALUES (
  'user-uuid', 'crime', 'Theft Report',
  'Valuables stolen from home', 'Lekki, Lagos',
  6.4281, 3.4219, false, 'submitted'
);
```

### 3. Admin Dashboard & Report Management

**Key Features:**
- View all reports
- Filter by type/status
- Update report status
- View location map with markers
- User management
- Analytics & charts

**Admin Workflow:**
1. Admin logs in (`admin@test.com` / `admin123`)
2. Dashboard shows KPIs:
   - Total Reports
   - Pending Reports
   - Resolved Reports
   - Active Users
3. Types of reports chart (pie chart)
4. Status distribution (bar chart)
5. Click on report to view details
6. Update status (under-review → resolved)
7. Send notifications to users

**Status Update Example:**
```javascript
// Admin updates report status
async function updateReportStatus(reportId, newStatus) {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status: newStatus,
      notes: 'Crime resolved by police'
    })
  });
  
  const result = await response.json();
  return result.data;
}
```

### 4. Location Tracking & Maps

**Features:**
- Interactive Leaflet.js maps
- Pin incident locations
- Different marker colors by type
- Satellite view option
- Address search

**Implementation:**
```javascript
// Initialize map in user report form
const reportMap = L.map('reportMap').setView([9.0765, 7.3986], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(reportMap);

// Click handler to set location
reportMap.on('click', function(e) {
  const { lat, lng } = e.latlng;
  updateLocationField(lat, lng);
  addMarker(lat, lng);
});
```

**Admin Map - Report Visualization:**
- Red markers: Crime
- Blue markers: Flood
- Orange markers: Fire
- Yellow markers: Accidents
- Click marker to view report details

---

## Role-Based Workflows

### Citizen/User Workflow

```
[Home Page] 
    ↓
[Login/Register] 
    ↓
[User Dashboard]
    ├── View submitted reports
    ├── Check report status
    ├── Receive notifications
    └── Submit new report
         ↓
    [Report Form]
    ├── Select incident type
    ├── Describe incident
    ├── Pin location on map
    ├── Attach photos
    └── Submit (Anonymous or not)
         ↓
    [Report Submitted]
    ├── Get Report ID
    ├── Track status updates
    └── Receive notifications
```

### Admin Workflow

```
[Login]
    └── admin@test.com / admin123
         ↓
[Admin Dashboard]
    ├── View KPIs
    ├── Charts & Analytics
    └── 7 Main Sections:
        1. Dashboard
        2. All Reports
        3. Report Map
        4. Analytics
        5. User Management
        6. Notifications Settings
        7. System Settings
             ↓
[Report Management]
├── Review reports
├── Update status
├── Send notifications
└── Track resolution
     ↓
[User Management]
├── View users
├── Change user status
├── View user reports
└── Manage permissions
     ↓
[System Configuration]
├── Notification settings
├── System parameters
├── Report policies
└── Email/SMS integration
```

---

## Database Schema

### Key Tables

#### 1. Users Table
```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password (PASSWORD HASH)
├── name (VARCHAR)
├── phone (VARCHAR)
├── role (user/admin)
├── status (active/inactive/suspended)
├── agency (for admins)
├── jurisdiction (for admins)
├── created_at
└── updated_at
```

#### 2. Reports Table
```
reports
├── id (UUID, PK)
├── user_id (FK → users)
├── incident_type
├── title
├── description
├── location
├── latitude / longitude
├── anonymous (BOOLEAN)
├── status (submitted/under-review/resolved/rejected)
├── verifications (count)
├── created_at
├── updated_at
└── resolved_at
```

#### 3. Report Updates Table
```
report_updates
├── id (UUID, PK)
├── report_id (FK → reports)
├── admin_id (FK → users)
├── status
├── notes
└── created_at
```

#### 4. Notifications Table
```
notifications
├── id (UUID, PK)
├── user_id (FK → users)
├── report_id (FK → reports)
├── type (email/sms/push)
├── title
├── message
├── read (BOOLEAN)
├── created_at
├── read_at
└── sent_at
```

#### 5. Audit Logs Table
```
audit_logs
├── id (UUID, PK)
├── user_id (FK → users)
├── action
├── resource_type
├── resource_id
├── details (JSONB)
├── ip_address
├── user_agent
└── created_at
```

### Relationships Diagram

```
users (1) ──────── (N) reports
  │                      │
  │                      └──── (N) report_updates
  │                      └──── (N) report_verifications
  │
  └──────── (N) notifications
  │
  └──────── (N) audit_logs
```

---

## API Integration

### Authentication Flow

```
1. User Registration/Login
   POST /api/auth/register
   POST /api/auth/login
   ↓
2. Receive JWT Token + Refresh Token
   {
     "token": "eyJhbGc...",
     "refreshToken": "eyJhbGc..."
   }
   ↓
3. Store in localStorage
   localStorage.setItem('token', token)
   ↓
4. Include in all subsequent requests
   Authorization: Bearer <token>
   ↓
5. Token expires? Use refresh token
   POST /api/auth/refresh
   → Get new token
```

### Complete API Reference

#### Authentication
```
POST   /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+234-800-0000001",
  "role": "user",
  "agency": "optional for admin"
}

POST   /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

POST   /api/auth/refresh
{
  "refreshToken": "refresh_token_here"
}

GET    /api/auth/verify
(No body, uses Authorization header)
```

#### Reports
```
GET    /api/reports
Query params: ?status=submitted&type=crime&page=1&limit=10

GET    /api/reports/:id

POST   /api/reports
{
  "incidentType": "crime",
  "title": "Theft reported",
  "description": "...",
  "location": "...",
  "anonymous": false,
  "photos": []
}

PUT    /api/reports/:id (Admin only)
{
  "status": "under-review",
  "notes": "Investigating..."
}

DELETE /api/reports/:id (Admin only)

POST   /api/reports/:id/verify
(Verify/upvote a report)
```

#### Users
```
GET    /api/users (Admin only)
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id (Admin only)
PATCH  /api/users/:id/status (Admin only)
{
  "status": "active" | "inactive" | "suspended"
}

GET    /api/users/:id/reports (Admin only)
```

#### Notifications
```
GET    /api/notifications
Query: ?page=1&limit=20

POST   /api/notifications/send (Admin only)
{
  "userId": "user-uuid",
  "type": "email|sms|push",
  "title": "Report Update",
  "message": "Your report has been resolved"
}

PATCH  /api/notifications/:id/read
DELETE /api/notifications/:id

POST   /api/notifications/bulk-send (Admin only)
{
  "userIds": ["uuid1", "uuid2"],
  "type": "email",
  "title": "System Alert",
  "message": "..."
}
```

---

## Security Best Practices

### 1. Password Security
```javascript
// Backend: Hash passwords with bcrypt
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
// Verify: await bcrypt.compare(password, hashedPassword)
```

### 2. JWT Token Security
- Store tokens in localStorage (or secure HttpOnly cookies)
- Include in Authorization header
- Set short expiration (7 days)
- Use refresh tokens for extension
- Validate signature on backend

### 3. Rate Limiting
```javascript
// Prevent brute force login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts'
});

app.post('/api/auth/login', loginLimiter, handleLogin);
```

### 4. Input Validation
```javascript
// Validate all user inputs
const { validationResult, body } = require('express-validator');

router.post('/api/reports', [
  body('title').trim().notEmpty().isLength({ min: 5, max: 200 }),
  body('description').trim().notEmpty().isLength({ min: 10 }),
  body('location').trim().notEmpty(),
  body('incidentType').isIn(['crime', 'flood', 'fire', 'accident', 'health']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process valid data
});
```

### 5. SQL Injection Prevention
```javascript
// Use parameterized queries - ALWAYS
const query = 'SELECT * FROM users WHERE email = $1';
db.query(query, [userEmail]); // ✓ Safe

// NEVER do this:
const query = `SELECT * FROM users WHERE email = '${userEmail}'`; // ✗ Unsafe
```

### 6. CORS Protection
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));
```

### 7. Audit Logging
```javascript
// Log all critical actions
async function logAction(userId, action, resource, details) {
  await db.query(
    'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
    [userId, action, resource, JSON.stringify(details)]
  );
}
```

---

## Notification System

### Multi-Channel Notifications

#### 1. Email Notifications
```javascript
// Uses SendGrid or SMTP
const sendEmail = async (to, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: to,
    subject: subject,
    html: message
  });
};
```

#### 2. SMS Notifications
```javascript
// Uses Twilio API
const sendSMS = async (phoneNumber, message) => {
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: phoneNumber
  });
};
```

#### 3. Push Notifications
```javascript
// Uses Firebase Cloud Messaging
const sendPushNotification = async (deviceToken, title, body) => {
  const admin = require('firebase-admin');
  
  await admin.messaging().send({
    notification: {
      title: title,
      body: body
    },
    token: deviceToken
  });
};
```

### Notification Triggers

1. **Report Submitted** → Admin alert
2. **Report Status Changed** → User notification
3. **Report Verified** → Report owner notification
4. **New Report in Area** → Nearby users notification
5. **System Alert** → Mass notification

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update all environment variables in `.env`
- [ ] Set strong JWT_SECRET and REFRESH_TOKEN_SECRET
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure CORS for production domain
- [ ] Set up PostgreSQL backups
- [ ] Set up MongoDB backups
- [ ] Configure email service (SendGrid/SMTP)
- [ ] Configure SMS service (Twilio/Africa's Talking)
- [ ] Set up Firebase for push notifications
- [ ] Configure AWS S3 for file uploads
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Review security settings

### Deployment Commands

```bash
# 1. Build Docker image
docker build -t community-reporting:1.0 .

# 2. Push to registry
docker push yourregistry/community-reporting:1.0

# 3. Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker exec community_reporting_api npm run migrate:latest

# 5. Verify deployment
curl https://api.yourdomain.com/api/health
```

### Health Checks

```bash
# Check backend API
curl http://localhost:5000/api/health

# Check database connection
psql -h localhost -U postgres -d community_reporting_db -c "SELECT version();"

# Check MongoDB
mongo --eval "db.adminCommand('ping')"

# View logs
docker logs community_reporting_api
docker logs community_reporting_db
```

### Monitoring

- Set up CloudWatch/Azure Monitor
- Configure alerts for:
  - High error rate
  - Database connection issues
  - API response times > 1s
  - Disk space < 10%
  - High CPU usage

---

## Troubleshooting Common Issues

### Issue: Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Issue: Database Connection Refused
```bash
# Ensure PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -c "\l"
```

### Issue: JWT Token Invalid
```javascript
// Check token format
const token = localStorage.getItem('token');
console.log(token); // Should start with "eyJ..."

// Verify in header
headers: { 'Authorization': `Bearer ${token}` }
```

### Issue: CORS Error
```javascript
// Add to backend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## Performance Optimization

### Database Optimization
- Add indexes on frequently queried columns ✓
- Use pagination for large result sets
- Archive old reports
- Use connection pooling

### Frontend Optimization
- Lazy load maps (Leaflet)
- Cache JS/CSS files
- Compress images
- Use gzip compression

### API Optimization
- Cache GET requests with Redis
- Implement pagination
- Use CDN for static assets
- Monitor query performance

---

## Next Steps

1. **Deploy to Production**: Pick your hosting (AWS/Azure/Firebase)
2. **Set up CI/CD**: GitHub Actions or GitLab CI
3. **Mobile Apps**: Build Flutter/React Native versions
4. **Advanced Analytics**: Add ML-based spam detection
5. **Integration**: Connect with real emergency services APIs

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Author:** Community Reporting System Team
