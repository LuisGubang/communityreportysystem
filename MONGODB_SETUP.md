# MongoDB Integration Setup Guide

## Step-by-Step MongoDB Connection Setup

### Part 1: Create MongoDB Atlas Cluster

#### Step 1.1: Sign Up / Login to MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** or **"Sign In"**
3. Use your email: **luisgubang3@gmail.com**
4. Create a password and complete verification

#### Step 1.2: Create a New Project
1. After logging in, click **"Create a Project"**
2. Project Name: **community-reporting-system**
3. Click **"Create Project"**

#### Step 1.3: Create a Cluster
1. Click **"Create a Cluster"**
2. Choose **"Shared"** (free tier - perfect for development)
3. Select Provider/Region:
   - **Cloud Provider**: AWS
   - **Region**: Select closest to you (e.g., us-east-1 for US, eu-west-1 for Europe)
4. Cluster Name: **community-reports** (or leave default)
5. Click **"Create Cluster"** (takes 1-3 minutes)

#### Step 1.4: Create Database User
While cluster is creating:
1. Left sidebar → **Database Access**
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `reports_user`
5. **Password**: Create a strong password (copy & save it!)
   - Example: `MongoDb@Reports2026`
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

#### Step 1.5: Allow Network Access
1. Left sidebar → **Network Access**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (or your IP)
4. This allows your backend to connect

#### Step 1.6: Get Connection String
1. Back to **Clusters** view
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **Driver**: Node.js
5. Copy the connection string

**It will look like:**
```
mongodb+srv://reports_user:<password>@community-reports.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Replace `<password>` with your actual password**

---

### Part 2: Update Backend Code

#### Step 2.1: Update .env file

Create/update `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb+srv://reports_user:MongoDb@Reports2026@community-reports.xxxxx.mongodb.net/?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_secret_key_here_change_this
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_secret_change_this

# Database (PostgreSQL - optional for now)
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=community_reports
DB_PORT=5432

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10

# Other Services (leave blank for now)
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_PHONE=
```

---

### Part 3: Install Dependencies

Run in terminal:

```bash
cd backend
npm install mongoose dotenv bcryptjs jsonwebtoken express-validator cors helmet compression express-rate-limit
```

---

### Part 4: Create MongoDB Models

Create `backend/models/User.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  agency: {
    type: String,
    default: null  // For admin users
  },
  jurisdiction: {
    type: String,
    default: null  // For admin users
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
```

---

### Part 5: Updated Backend Code Files

After this guide, you'll get updated versions of:
- `backend/server.js` - Connect MongoDB
- `backend/routes/auth.js` - Use MongoDB for auth
- `backend/models/User.js` - MongoDB schema
- `.env` - MongoDB connection string

---

## Testing the Connection

### With MongoDB Atlas GUI:
1. Go to **Clusters** → **Collections**
2. You should see your database and collections

### With Backend:
```bash
cd backend
npm start
```

Check logs for: `✓ MongoDB Connected!`

If there's an error like "Authentication failed", double-check:
- Username matches exactly
- Password is correct (doesn't have special chars issues)
- Network access is allowed
- Connection string has correct cluster name

---

## Next: Setup User Registration with MongoDB

Once connected, you can:
1. Register new users (saves to MongoDB)
2. Login validates MongoDB
3. Admin can see all users in MongoDB
4. All data persists across server restarts

---

## Troubleshooting

### "Authentication failed"
- Check username/password in MongoDB Atlas
- Ensure user was created with correct privileges
- Verify network access is enabled

### "Connection timeout"
- Check internet connection
- Verify MongoDB cluster is running
- Check if region is correct

### "Database already exists"
- That's fine! MongoDB will use existing database

---

**Once you complete these steps, reply and I'll update the backend code!**
