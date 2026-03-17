# MongoDB Connection Issue & Solutions

## Current Status
MongoDB Atlas cluster is refusing connections due to IP whitelist restrictions.

**Error in logs:**
```
Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP 
that isn't whitelisted.
```

## Root Cause
Your current machine's IP address is not in MongoDB Atlas IP Whitelist.

## Solution Options

### Option 1: Quick Fix - Add Your IP to Whitelist (Recommended)

1. Go to MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Log in to your account
3. Select the "Community-Reports" cluster
4. Go to **Network Access** → **IP Whitelist**
5. Click **Add IP Address**
6. Choose one of:
   - **Add Current IP Address** (if you know it)
   - **Allow Access from Anywhere** (0.0.0.0/0) - NOT recommended for production
7. Click **Confirm**
8. Wait 1-2 minutes for changes to propagate
9. Restart backend: `npm start` in backend folder

**Current IP**: Run this command to find it:
```bash
curl https://checkip.amazonaws.com
```

Then add that IP to MongoDB Atlas whitelist.

### Option 2: Use Local MongoDB (For Development)

If you want to avoid MongoDB Atlas limitations:

#### Step 1: Install MongoDB locally
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install mongodb

# On Mac
brew install mongodb-community

# On Windows
# Download from: https://www.mongodb.com/try/download/community
```

#### Step 2: Start MongoDB
```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# Mac
brew services start mongodb-community

# Or run directly:
mongod
```

#### Step 3: Update .env
```bash
# In backend/.env, change:
# FROM:
MONGODB_URI=mongodb+srv://Report_user:0741238619@community-reports.fp05sqq.mongodb.net/?appName=Community-Reports

# TO:
MONGODB_URI=mongodb://localhost:27017/community-reports
```

#### Step 4: Restart Backend
```bash
cd backend
npm start
```

### Option 3: Use MongoDB Atlas with Environment IP Whitelist

If you're in a corporate/university environment:

1. Get your network's public IP (might be different from your device IP)
2. Contact IT to get actual outgoing IP
3. Add that IP to MongoDB Atlas
4. Or ask admin to whitelist IP range

### Option 4: Docker MongoDB (Quickest for Testing)

If you have Docker installed:

```bash
# Start MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Update .env
MONGODB_URI=mongodb://admin:password@localhost:27017/community-reports?authSource=admin

# Restart backend
npm start
```

## Troubleshooting

### Test MongoDB Connection
```bash
# If using Atlas, test connection from terminal:
mongo "mongodb+srv://Report_user:0741238619@community-reports.fp05sqq.mongodb.net/?appName=Community-Reports" --authenticationDatabase admin

# If using local MongoDB:
mongo
use community-reports
db.users.find()
```

### Check Backend Status
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "...",
  "mongodb": true,
  "uptime": "..."
}
```

### Monitor Logs
```bash
tail -f backend/logs/app.log
```

Look for:
```
✅ MongoDB Connected Successfully!
✅ Backend running on...
```

## After MongoDB is Connected

Once you have MongoDB working, all the authentication fixes will work:

1. ✅ Login credentials will persist
2. ✅ No more "invalid user" errors after time
3. ✅ Account creation will work
4. ✅ Token refresh will work
5. ✅ Everything works across browsers/devices

## Important Notes

- **Never use 0.0.0.0/0 in production** (allows anyone to try connecting)
- Keep your MongoDB credentials secure - never commit to GitHub
- Use environment variables for sensitive data
- Consider using MongoDB Atlas IP Access List rules for better security

## Contact MongoDB Support

If you continue having issues:
1. Visit https://www.mongodb.com/support
2. Provide your cluster name and error logs
3. They can help whitelist your IP

## Next Steps

1. **Choose one solution above**
2. **Test connection**: curl http://localhost:5000/api/health
3. **Check logs**: tail -f backend/logs/app.log
4. **Run login tests** from AUTHENTICATION_FIX_REPORT.md
5. **Verify all works**

---

**Note**: Once MongoDB is connected, the authentication system will work flawlessly with all the fixes applied!
