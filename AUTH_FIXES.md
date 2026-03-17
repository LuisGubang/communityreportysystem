# Authentication Issues - Fixed

## Problems Identified and Resolved

### 1. **Dual User Storage Issue (FIXED)**
**Problem**: Users were stored in two places:
- localStorage (with plaintext passwords)
- MongoDB (with bcrypt hashed passwords)

After some time, localStorage would be cleared or user was on different browser/device, causing login failures.

**Solution**: 
- ✅ Removed localStorage user storage in registration
- ✅ All users now stored only in MongoDB
- ✅ Login uses backend API only (no localStorage user lookup)

### 2. **JWT Token Expiration (FIXED)**
**Problem**: JWT tokens expired after 7 days without refresh mechanism
- Expired tokens caused "Invalid user" errors
- No automatic token refresh capability

**Solution**:
- ✅ Increased JWT expiry from 7 days to 30 days
- ✅ Implemented automatic token refresh mechanism
- ✅ Frontend now retries failed requests after refreshing token
- ✅ Refresh tokens valid for 30 days

### 3. **Auth Middleware Database Lookup Issue (FIXED)**
**Problem**: The authenticate middleware was doing a database lookup on EVERY API request
- If user record had any issues or was deleted, it returned "User not found"
- Slowed down every authenticated request

**Solution**:
- ✅ Middleware now uses token data only (no DB lookup)
- ✅ Faster authentication checks
- ✅ More reliable - doesn't depend on database availability for token validation

### 4. **Registration Issues (FIXED)**
**Problem**: Registration stored plaintext passwords in localStorage
- Passwords visible if localStorage inspected
- Password mismatch between frontend and backend

**Solution**:
- ✅ All registration now goes to backend API only
- ✅ Passwords hashed with bcrypt in MongoDB
- ✅ Falls back with proper error message if backend unavailable

### 5. **Login Role Parameter (FIXED)**
**Problem**: Frontend sent role parameter that backend ignored
- Confusion about whether role was being validated
- Role came from database, not from request

**Solution**:
- ✅ Removed role parameter from login request
- ✅ Backend determines role from user record in database
- ✅ Frontend uses role from response for redirects

### 6. **Token Refresh Mechanism (ADDED)**
**Solution**:
- New function `refreshAuthToken()` automatically refreshes expired tokens
- API requests now include token refresh logic
- Users won't be abruptly logged out when tokens expire

## Files Modified

1. **backend/.env**
   - Increased JWT_EXPIRE from 7d to 30d

2. **js/main.js**
   - Added `refreshAuthToken()` function
   - Added `clearAuthentication()` function
   - Enhanced `apiRequest()` with automatic token refresh
   - Removed localStorage user registration
   - Removed plaintext password storage
   - Simplified login to use backend API only

3. **backend/middleware/auth.js**
   - Removed database lookup from authenticate middleware
   - Uses token data only for authentication

4. **backend/routes/auth.js**
   - Added better error logging for failed logins
   - Improved error messages for inactive accounts

## Testing the Fixes

### Test 1: Create New Account
```
1. Go to /register.html
2. Register as a user or admin
3. Should redirect to login.html after registration
```

### Test 2: Login Immediately After Registration
```
1. Create account
2. Login immediately
3. Should redirect to appropriate dashboard (admin or user)
```

### Test 3: Login After 30 Days (Token Expiration)
```
1. Manually test by setting JWT_EXPIRE back to "1m"
2. Wait for token to expire
3. Make any API call
4. Should automatically refresh token
5. Should continue working without redirect to login
```

### Test 4: Test on Different Browser
```
1. Register account
2. Clear all localStorage
3. Go to login.html
4. Login with same credentials
5. Should work (uses backend API, not localStorage)
```

### Test 5: Admin Registration Code
```
1. Try to register as admin with wrong code
2. Should show error
3. Try with correct code: ADMIN2026
4. Should succeed
```

## Credentials For Testing

**Demo User Account:**
- Email: user@test.com
- Password: password123

**Demo Admin Account:**
- Email: admin@test.com
- Password: admin123

**Admin Registration Code:** ADMIN2026

## How Authentication Works Now

```
User Login Flow:
1. User enters email & password
2. Frontend sends to /api/auth/login
3. Backend verifies email exists and password matches
4. Backend checks user status is 'active'
5. Backend generates JWT token (30-day expiry)
6. Backend generates refresh token (30-day expiry)
7. Both tokens stored in localStorage
8. Frontend redirects to dashboard

Subsequent API Calls:
1. Frontend includes JWT in Authorization header
2. Middleware verifies JWT signature & expiry
3. If expired: Frontend automatically refreshes using refresh token
4. Retry API call with new JWT
5. If refresh fails: User redirected to login

Token Refresh Flow:
1. API returns 401 (Unauthorized)
2. Frontend detects and calls /api/auth/refresh
3. Sends refresh token to backend
4. Backend verifies refresh token and generates new JWT
5. Frontend retries original API call with new JWT
```

## Environment Variables

Make sure these are set in `backend/.env`:

```
JWT_SECRET=your_super_secret_jwt_key_change_in_production_2026
JWT_EXPIRE=30d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_change_in_production
ADMIN_REGISTRATION_CODE=ADMIN2026
```

**IMPORTANT**: In production, change these values to strong, unique keys!

## Troubleshooting

### Issue: "Invalid email or password" on login
- Check that account exists in MongoDB
- Verify password is correct
- Check MongoDB connection is working
- Check logs: `tail -f backend/logs/app.log`

### Issue: "User account is not active"
- User status in database is not 'active'
- Contact admin to activate account

### Issue: "Token refresh failed"
- Check backend /api/auth/refresh endpoint is working
- Check refresh token is still valid (< 30 days old)
- Check JWT secrets are correct in .env

### Issue: Still getting logged out after 30 days
- Token refresh might be failing silently
- Check browser console for errors
- Check backend logs for refresh errors
- Manually login again (this is expected after 30 days with no activity)

## Database Schema

User documents in MongoDB now have:
- email (unique, required)
- password (hashed with bcrypt, required)
- name (required)
- role (user or admin)
- status (active, inactive, suspended)
- phone (optional)
- agency (admin only)
- jurisdiction (admin only)
- loginCount (tracks login count)
- lastLogin (timestamp of last login)
- loginHistory (array of login records)
- createdAt, updatedAt (timestamps)

## Next Steps (Optional Improvements)

1. **Add email verification** for new accounts
2. **Add password reset** functionality
3. **Add 2FA** (two-factor authentication)
4. **Add account lockout** after failed login attempts
5. **Add OAuth** (Google, GitHub login)
6. **Update admin dashboard** to fetch users from backend API (currently uses localStorage)

## Support

If you encounter any authentication issues:
1. Check this file for the fix
2. Review the modified files
3. Check backend logs: `tail -f backend/logs/app.log`
4. Check browser console for errors (F12)
5. Ensure backend server is running on port 5000
6. Ensure MongoDB is connected and accessible
