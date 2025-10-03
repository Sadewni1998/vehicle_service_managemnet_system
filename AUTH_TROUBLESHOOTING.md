# Authentication System Troubleshooting Guide

## 🔍 Common Issues and Solutions

### 1. **Registration Issues**

#### Issue: "Server error during registration"
**Causes:**
- Database connection issues
- Missing environment variables
- Database tables not created
- Invalid data format

**Solutions:**
1. **Check Database Connection:**
   ```bash
   # Make sure MySQL is running
   mysql -u root -p
   ```

2. **Check Environment Variables:**
   Create `.env` file in `vehicle-service-backend/`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=vehicle_service_db
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Create Database Tables:**
   ```bash
   mysql -u root -p < vehicle-service-backend/db_setup.sql
   ```

#### Issue: "Email already exists"
**Solution:** This is expected behavior. User should login instead.

#### Issue: "Name, email, and password are required"
**Solution:** Check form validation and ensure all required fields are filled.

### 2. **Login Issues**

#### Issue: "Invalid email or password"
**Causes:**
- Wrong email or password
- User not registered
- Password not hashed correctly

**Solutions:**
1. **Verify User Exists:**
   ```sql
   SELECT * FROM customer WHERE email = 'test@example.com';
   ```

2. **Check Password Hashing:**
   The backend uses bcrypt to hash passwords. Make sure the login is using the same email/password used during registration.

#### Issue: "Server error during login"
**Causes:**
- Database connection issues
- JWT secret missing
- Invalid token generation

**Solutions:**
1. **Check JWT Secret:**
   Make sure `JWT_SECRET` is set in `.env` file
2. **Check Database Connection:**
   Verify database is running and accessible

### 3. **Frontend Issues**

#### Issue: "Registration failed" or "Login failed"
**Causes:**
- API endpoint not reachable
- CORS issues
- Network connectivity

**Solutions:**
1. **Check Backend Server:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check CORS Configuration:**
   Backend should allow frontend origin in CORS settings

3. **Check Network Tab:**
   Open browser dev tools → Network tab to see failed requests

## 🚀 Step-by-Step Fix Process

### Step 1: Backend Setup
```bash
cd vehicle-service-backend

# Install dependencies
npm install

# Create .env file with database credentials
echo "DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vehicle_service_db
JWT_SECRET=your_jwt_secret_here
PORT=5000
FRONTEND_URL=http://localhost:5173" > .env

# Start server
npm start
```

### Step 2: Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS vehicle_service_db;"

# Import tables
mysql -u root -p vehicle_service_db < vehicle-service-backend/db_setup.sql
```

### Step 3: Frontend Setup
```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start frontend
npm run dev
```

### Step 4: Test Authentication
```bash
# Run test script
node test-auth.js
```

## 🧪 Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] Database connected and tables created
- [ ] Environment variables set correctly
- [ ] User can register successfully
- [ ] User can login successfully
- [ ] Invalid credentials are rejected
- [ ] JWT token is generated and stored
- [ ] User data is saved to database

## 🔧 Debug Commands

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### Check Database Connection
```bash
mysql -u root -p -e "USE vehicle_service_db; SHOW TABLES;"
```

### Check User Data
```sql
SELECT * FROM customer ORDER BY createdAt DESC LIMIT 5;
```

### Test API Endpoints
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","phone":"1234567890"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚨 Emergency Fixes

### If Nothing Works:

1. **Reset Everything:**
   ```bash
   # Stop all servers
   # Delete node_modules
   rm -rf node_modules
   rm -rf vehicle-service-backend/node_modules
   
   # Reinstall
   npm install
   cd vehicle-service-backend && npm install
   
   # Restart database
   # Recreate database and tables
   # Start servers
   ```

2. **Check Logs:**
   - Backend: Check terminal where server is running
   - Frontend: Check browser console
   - Database: Check MySQL error logs

3. **Verify Environment:**
   ```bash
   # Check if ports are available
   netstat -an | grep :5000
   netstat -an | grep :5173
   ```

## ✅ Success Indicators

When everything works correctly:
- ✅ Registration shows success message
- ✅ User is redirected to home page after registration
- ✅ Login shows success message
- ✅ User is redirected to home page after login
- ✅ User data appears in database
- ✅ JWT token is stored in localStorage
- ✅ User can access protected pages

## 📋 Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Server error during registration" | Database connection | Check DB credentials and connection |
| "Email already exists" | User already registered | User should login instead |
| "Invalid email or password" | Wrong credentials | Check email/password combination |
| "Access denied. No token provided" | Not logged in | User must login first |
| "CORS error" | Cross-origin request blocked | Check CORS configuration |
| "Network Error" | Backend not running | Start backend server |

The authentication system should work perfectly after following these steps! 🎉
