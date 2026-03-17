# MongoDB Connection - Setup Complete! ✅

Your backend code has been successfully updated to use MongoDB!

## 🔐 Complete Your .env File

**IMPORTANT:** You need to add your MongoDB password to the `.env` file.

### Update backend/.env

Find this line in `backend/.env`:
```
MONGODB_URI=mongodb+srv://Report_user:<0741238619>@community-reports.fp05sqq.mongodb.net/?appName=Community-Reports
```

Replace `<db_password>` with your actual MongoDB password (the one you created when setting up your MongoDB user).

**Example:**
```
MONGODB_URI=mongodb+srv://Report_user:YourActualPassword@community-reports.fp05sqq.mongodb.net/?appName=Community-Reports
```

---

## 📦 Install Dependencies

Run this command in the `backend` folder:

```bash
cd backend
npm install
```

This will install all required packages including:
- `mongoose` - MongoDB driver
- `express` - Web framework
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- And all other required packages

---

## 🚀 Start the Backend Server

Once you've updated the .env file and installed dependencies:

```bash
cd backend
npm run dev
```

You should see output like:
```
🔄 Connecting to MongoDB...
   URI: mongodb+srv://Report_user:****@community-reports.fp05sqq.mongodb.net/?appName=Community-Reports
✅ MongoDB Connected Successfully!
   Database: community-reports
   Host: community-reports.fp05sqq.mongodb.net

============================================================
🚀 Community Reporting System API
============================================================
✅ Server running on http://localhost:5000
📝 Environment: development
============================================================
```

---

## ✅ What's Been Updated

### Files Created:
- ✅ `backend/models/User.js` - MongoDB User schema
- ✅ `backend/models/Report.js` - MongoDB Report schema
- ✅ `backend/.env` - Environment configuration (with MongoDB URI)

### Files Modified:
- ✅ `backend/server.js` - Added MongoDB connection
- ✅ `backend/routes/auth.js` - Now uses MongoDB for authentication
- ✅ `backend/middleware/auth.js` - Updated for MongoDB User model

---

## 🧪 Test the Connection

After the server starts, you can test it:

### Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-07T...",
  "uptime": 2.5,
  "database": {
    "mongodb": "connected",
    "mongooseState": 1,
    "name": "community-reports"
  }
}
```

### Status Check
```bash
curl http://localhost:5000/api/status
```

---

## 📝 Next: Test User Registration

Once server is running, test registration:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@test.com",
    "password": "password123",
    "name": "Test User",
    "phone": "+234-800-000-0001",
    "role": "user"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "testuser@test.com",
    "name": "Test User",
    "role": "user",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🔑 Key Features Now Enabled

✅ **Real User Storage** - Users saved in MongoDB  
✅ **Persistent Authentication** - Login data survives server restarts  
✅ **User Login Tracking** - Track logins and login history  
✅ **Password Security** - Passwords hashed with bcrypt  
✅ **JWT Tokens** - Secure token-based authentication  
✅ **Role-Based Access** - Admin and user roles  
✅ **Admin Registration** - Requires admin code  

---

## ⚠️ Important Notes

1. **Never commit .env file to Git** - It contains credentials
2. **Keep your MongoDB password private** - Don't share it
3. **Use strong passwords** - For both MongoDB and app
4. **MongoDB Atlas Free Tier** - Limited but great for development

---

## 🐛 Troubleshooting

### "Authentication failed"
- Check username: `Report_user` (exact spelling)
- Check password is correct in .env
- Verify in MongoDB Atlas that user exists

### "Connection timeout"
- Check internet connection
- Verify MongoDB cluster is running (check Atlas dashboard)
- Check if your IP is whitelisted in Network Access

### "Command 'npm' not found"
- Install Node.js from https://nodejs.org/
- Then run `npm install` again

### Server won't start
- Make sure MongoDB connection string is correct
- Check that .env file exists in backend folder
- Check for typos in MONGODB_URI
- Try `npm install` again

---

## 🎯 Next Steps

1. ✅ Update .env with your MongoDB password
2. ✅ Run `npm install` in backend folder
3. ✅ Run `npm run dev` to start server
4. ✅ Test with curl commands
5. ✅ Create test user accounts
6. ✅ Test login/registration from frontend

---

## 📞 Questions?

Check these endpoints:
- `GET /api/health` - Server status
- `GET /api/status` - Database status
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify token

All working? Great! Your backend is MongoDB-ready! 🎉
