# Google OAuth Troubleshooting Guide

## Common "Server Error During Google Sign-In" Issues

### 🔍 **Issue 1: Invalid Google Client ID**

**Problem**: The Google Client ID in your `.env` file is incorrect.

**Current (WRONG)**:
```env
GOOGLE_CLIENT_ID=http://584667634499-3l8mh29qabpqpcjpds7p0p6a5t3gv3bl.apps.googleusercontent.com
```

**Fix**: Remove the `http://` prefix:
```env
GOOGLE_CLIENT_ID=584667634499-3l8mh29qabpqpcjpds7p0p6a5t3gv3bl.apps.googleusercontent.com
```

### 🔍 **Issue 2: Database Schema Not Updated**

**Problem**: The `customer` table doesn't have Google OAuth columns.

**Check**: Run this SQL query in your database:
```sql
DESCRIBE customer;
```

**Expected columns**:
- `googleId` (VARCHAR(255) UNIQUE NULL)
- `provider` (VARCHAR(50) NOT NULL DEFAULT 'local')

**Fix**: Run the database migration:
```sql
USE vehicle_service_db;

ALTER TABLE customer
    MODIFY COLUMN password VARCHAR(255) NULL,
    ADD COLUMN googleId VARCHAR(255) UNIQUE NULL,
    ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'local';
```

### 🔍 **Issue 3: Google OAuth Library Not Working**

**Problem**: The `google-auth-library` package has issues.

**Check**: Verify installation:
```bash
cd vehicle-service-backend
npm list google-auth-library
```

**Fix**: Reinstall if needed:
```bash
cd vehicle-service-backend
npm uninstall google-auth-library
npm install google-auth-library@^10.4.0
```

### 🔍 **Issue 4: Environment Variables Not Loaded**

**Problem**: The `.env` file is not being loaded properly.

**Check**: Add this to your backend `index.js`:
```javascript
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
```

**Fix**: Ensure `.env` is in the correct location and `dotenv` is configured:
```javascript
require("dotenv").config();
```

### 🔍 **Issue 5: CORS Issues**

**Problem**: Frontend can't communicate with backend.

**Check**: Verify CORS configuration in `index.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
```

### 🔍 **Issue 6: Invalid Google Token**

**Problem**: The frontend is sending an invalid token format.

**Check**: The frontend should send a proper Google ID token, not an access token.

**Fix**: Update the Google Auth hook to use proper ID token:
```javascript
// In useGoogleAuth.js, use ID token instead of access token
const idToken = response.credential; // For Google Identity Services
```

## 🛠️ **Step-by-Step Troubleshooting**

### Step 1: Check Backend Logs
```bash
cd vehicle-service-backend
npm start
```
Look for error messages in the console.

### Step 2: Test Backend Endpoint
```bash
# Test if the endpoint exists
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "test"}'
```

### Step 3: Check Database Connection
```bash
# Test database connection
mysql -u root -p vehicle_service_db
```
Then run:
```sql
SELECT * FROM customer LIMIT 1;
```

### Step 4: Verify Google Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "Credentials"
3. Find your OAuth 2.0 Client ID
4. Copy the correct Client ID (without `http://`)

### Step 5: Test Frontend Integration
1. Open browser developer tools
2. Go to Login page
3. Click Google button
4. Check console for errors

## 🔧 **Quick Fixes**

### Fix 1: Update Google Client ID
```bash
# Edit the .env file
cd vehicle-service-backend
# Remove http:// from GOOGLE_CLIENT_ID
```

### Fix 2: Run Database Migration
```sql
USE vehicle_service_db;
ALTER TABLE customer
    MODIFY COLUMN password VARCHAR(255) NULL,
    ADD COLUMN googleId VARCHAR(255) UNIQUE NULL,
    ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'local';
```

### Fix 3: Restart Servers
```bash
# Backend
cd vehicle-service-backend
npm start

# Frontend (in another terminal)
npm run dev
```

## 🧪 **Testing the Fix**

1. **Start both servers**
2. **Go to Login page**
3. **Click Google button**
4. **Complete Google OAuth flow**
5. **Check if user is logged in**

## 📋 **Common Error Messages**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Google token is required" | No token sent | Check frontend implementation |
| "Invalid token" | Wrong token format | Use proper Google ID token |
| "Database error" | Schema not updated | Run database migration |
| "CORS error" | Frontend URL not allowed | Update CORS configuration |
| "Google Client ID not found" | Environment variable missing | Check .env file |

## 🚨 **Emergency Fix**

If nothing works, try this minimal test:

1. **Update .env file**:
```env
GOOGLE_CLIENT_ID=584667634499-3l8mh29qabpqpcjpds7p0p6a5t3gv3bl.apps.googleusercontent.com
```

2. **Run database migration**:
```sql
ALTER TABLE customer ADD COLUMN googleId VARCHAR(255) UNIQUE NULL;
ALTER TABLE customer ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'local';
```

3. **Restart backend server**

4. **Test again**

The most common issue is the incorrect Google Client ID format with the `http://` prefix!
