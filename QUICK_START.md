# 🚀 Quick Start Guide - Community Reporting System

Welcome to the Community Reporting System! This guide will get you up and running in minutes.

## System Overview

A complete incident reporting platform where:
- **Citizens** can report incidents (crime, disasters, accidents, etc.)
- **Admins** manage reports, verify incidents, and send notifications
- **Features**: Location tracking, multi-channel notifications, real-time analytics

## 📦 What's Included

### ✅ Frontend (Ready to Use)
- Home page with hero section
- Login/Registration with role selection (User & Admin)
- **User Dashboard**: Submit reports, track status, notifications, profile
- **Admin Dashboard**: View all reports, analytics, user management, settings
- Interactive maps (Leaflet.js) - Click to set location
- Mobile-responsive design
- Fully functional with mock data

### ✅ Backend (Node.js + Express)
- Complete REST API with JWT authentication
- Database schema (PostgreSQL/MongoDB)
- All endpoints ready (auth, reports, users, notifications)
- Rate limiting & input validation
- Docker support

### ✅ Documentation
- Complete API documentation
- Database schema
- Implementation guide
- Deployment instructions

---

## ⚡ 5-Minute Setup

### Option 1: Run Frontend Only (Fastest)

```bash
# 1. Start simple HTTP server from project root
npx http-server -p 3000

# 2. Open browser
# http://localhost:3000

# 3. Test Logins:
# Citizen: user@test.com / password123
# Admin:   admin@test.com / admin123
```

### Option 2: Full Stack with Docker (Recommended)

```bash
# 1. Start all services
docker-compose up --build

# 2. Access services:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:5000
# Database:  localhost:5432 (PostgreSQL)

# 3. Test the API
curl http://localhost:5000/api/health

# 4. View logs
docker-compose logs -f backend
```

### Option 3: Manual Backend Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file
cp .env.example .env

# 3. Start server
npm run dev

# Backend runs at http://localhost:5000
```

---

## 🎯 Demo Credentials

### Login as Citizen
- **Email:** user@test.com
- **Password:** password123
- **Access:** User Dashboard

### Login as Admin
- **Email:** admin@test.com
- **Password:** admin123
- **Access:** Admin Dashboard

---

## 🌟 Top Features to Try

### For Citizens
1. ✅ Login with role selection
2. ✅ View dashboard statistics
3. ✅ Submit new report
4. ✅ Click on map to set location
5. ✅ Track report status
6. ✅ View notifications
7. ✅ Update profile

### For Admins
1. ✅ View all submitted reports (10+ reports seeded)
2. ✅ Filter by incident type and status
3. ✅ Click report to view details
4. ✅ Update report status (submitted → under-review → resolved)
5. ✅ View reports on interactive map
6. ✅ See analytics with charts
7. ✅ **NEW:** Monitor user logins - see total users who have accessed the system
8. ✅ **NEW:** View reports per user - detailed breakdown of each user's reports and their statuses
9. ✅ Manage users
10. ✅ Configure system settings
11. ✅ Send notifications

---

## 📁 Key Files Overview

```
community-reporting-system/
├── index.html                    # Home page
├── login.html                    # Login with role selection ⭐
├── register.html                 # Registration form
├── user-dashboard.html           # User/Citizen dashboard ⭐
├── admin-dashboard.html          # Admin dashboard ⭐
├── css/style.css                 # All styles (600+ lines)
├── js/
│   ├── main.js                   # Auth & core logic (1000+ lines)
│   ├── user-dashboard.js         # User dashboard features
│   └── admin-dashboard.js        # Admin features & charts
├── backend/
│   ├── server.js                 # Express server
│   ├── package.json              # Dependencies
│   ├── routes/
│   │   ├── auth.js               # Login/Register API
│   │   ├── reports.js            # Report CRUD API
│   │   ├── users.js              # User management API
│   │   └── notifications.js      # Notification API
│   ├── middleware/auth.js        # JWT authentication
│   ├── utils/logger.js           # Logging utility
│   └── db/init.sql               # PostgreSQL schema
├── docker-compose.yml            # Docker services
├── README.md                      # Full documentation
├── IMPLEMENTATION_GUIDE.md        # Technical guide
└── .env.example                  # Environment template
```

---

## 🔐 Authentication Flow

```
1. User visits login.html
2. Selects role (User or Admin)
3. Enters credentials
4. Backend validates against database
5. Returns JWT token
6. Token stored in localStorage
7. Redirected to appropriate dashboard
8. All API calls include token in Authorization header
```

**Mock Users (Local Storage):**
- Citizen: user@test.com
- Admin: admin@test.com

---

## 📊 Database Highlights

### Tables Included
1. **users** - User profiles & credentials
2. **reports** - Incident reports with location
3. **report_updates** - Status change history
4. **notifications** - Email/SMS/Push queue
5. **audit_logs** - Activity tracking
6. **settings** - System configuration

### Sample Queries
```sql
-- Get all reports
SELECT * FROM reports ORDER BY created_at DESC;

-- Get citizen's reports
SELECT * FROM reports WHERE user_id = 'uuid' AND anonymous = false;

-- Reports by incident type
SELECT incident_type, COUNT(*) FROM reports GROUP BY incident_type;

-- Reports by location
SELECT location, COUNT(*) FROM reports GROUP BY location ORDER BY COUNT(*) DESC;
```

---

## 📊 NEW: User Analytics Features

### User Login Tracking
The admin dashboard now tracks and displays:
- **Total Users Logged In** - See total number of unique users who have accessed the system
- **Login History** - Each user login is recorded with timestamp
- **User Activity** - View when users last logged in

### Reports per User (New Dashboard Section)
A comprehensive view showing:
- **User Email** - Each registered user account
- **Total Reports** - Count of reports submitted by user
- **Report Status Breakdown**:
  - 🟡 **Submitted** - Reports awaiting review
  - 🔵 **Under Review** - Reports being investigated
  - 🟢 **Resolved** - Completed incidents
- **Last Report Time** - When the user submitted their most recent report

Access this in Admin Dashboard → **Reports per User** section

---

## 🌐 API Examples

### Submit a Report
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "incidentType": "crime",
    "title": "Theft reported",
    "description": "Valuables stolen from home",
    "location": "Lekki, Lagos",
    "anonymous": false
  }'
```

### Get All Reports (Admin)
```bash
curl http://localhost:5000/api/reports \
  -H "Authorization: Bearer <admin_token>"
```

### Update Report Status (Admin)
```bash
curl -X PUT http://localhost:5000/api/reports/<report_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "status": "under-review",
    "notes": "Investigating..."
  }'
```

### Check API Health
```bash
curl http://localhost:5000/api/health
```

---

## 🗺️ Map Features

### User Report Form
- Interactive Leaflet.js map
- Click to set incident location
- Marker appears with coordinates
- Location automatically filled in form

### Admin Dashboard
- View all reports as markers
- Color-coded by incident type:
  - 🔴 Red = Crime
  - 🔵 Blue = Flood/Disaster
  - 🟠 Orange = Fire
  - 🟡 Yellow = Accidents
  - 🟢 Green = Other
- Click marker to view details
- Update status from popup

---

## 📈 Charts & Analytics

### Admin Dashboard Charts
1. **Reports by Type** - Donut chart
2. **Reports by Status** - Bar chart (with Chart.js)
3. **Daily Reports** - Line chart
4. **Geographic Distribution** - All reports on map

---

## 🔔 Notification System

### Supported Channels
1. **Email** - SMTP/SendGrid
2. **SMS** - Twilio/Africa's Talking
3. **Push** - Firebase Cloud Messaging

### Notification Triggers
- Report submitted
- Report status changed
- Admin sends alert
- System announcements

---

## ✅ What Works Out of the Box

- ✅ User registration & login
- ✅ Separate user and admin roles
- ✅ Report submission with maps
- ✅ Report status tracking
- ✅ Admin dashboard with analytics
- ✅ User management
- ✅ Location tracking (Leaflet)
- ✅ Charts & visualizations
- ✅ Notifications (structure ready)
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Responsive design
- ✅ Docker support
- ✅ Database schema
- ✅ Complete API

---

## ⚙️ Configuration

To enable real notifications, update `.env`:

```env
# Email (SendGrid)
SENDGRID_API_KEY=your_key_here

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here

# Push (Firebase)
FIREBASE_PROJECT_ID=your_project_id
```

---

## 🚀 Next Steps

1. **Explore Frontend** - Try both user and admin dashboards
2. **Test APIs** - Use curl or Postman
3. **Configure Backend** - Set up your database
4. **Customize** - Add your branding/features
5. **Deploy** - Push to AWS/Azure/Heroku

---

## 📚 Documentation

- **README.md** - Full project overview
- **IMPLEMENTATION_GUIDE.md** - Technical deep dive
- **backend/SETUP.md** - Backend specific setup
- **API Docs** - In code comments

---

## 🆘 Troubleshooting

### Frontend Not Loading
```bash
# Ensure HTTP server is running
npx http-server -p 3000
# Or check nginx in Docker
docker-compose logs frontend
```

### Backend API Not Responding
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# View logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Login Not Working
```javascript
// Check localStorage (open Dev Tools)
localStorage.getItem('currentUser')
localStorage.getItem('reports')

// Clear if needed
localStorage.clear()
```

---

## 💡 Tips & Tricks

1. **Demo Data**: Reload page to reset reports
2. **User Reports**: Only visible to that user (unless admin)
3. **Anonymous Reports**: Don't show user info
4. **Map Zoom**: Use map controls to zoom in/out
5. **Notifications**: Check in separate tab - they update in real-time
6. **Admin Features**: Only visible to admin role

---

## 📞 Support

- 📖 Read the implementation guide
- 🐛 Check browser console for errors
- 💾 Verify database is running
- 🔍 Check backend logs
- 📧 Contact: support@communityreporting.dev

---

## 🎉 You're All Set!

The system is fully functional and ready to:
✅ Report incidents  
✅ Track reports  
✅ Manage user data  
✅ Send notifications  
✅ Analyze data  
✅ Scale to production  

**Start exploring now!** 🚀

---

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Status:** Production Ready ✓
