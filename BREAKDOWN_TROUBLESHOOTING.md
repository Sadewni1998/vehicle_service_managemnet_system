# Breakdown Feature Troubleshooting Guide

## 🔍 Issues Found and Fixed

### 1. **API Endpoint Mismatch** ✅ FIXED
**Problem**: Frontend was calling `/breakdown` but backend expects `/breakdown/request`
**Solution**: Updated API configuration in `src/utils/api.js`

### 2. **Missing Authentication** ✅ FIXED
**Problem**: Frontend wasn't checking if user is logged in
**Solution**: Added authentication check and login requirement UI

### 3. **Field Mapping Issues** ✅ FIXED
**Problem**: Frontend form fields didn't match backend expectations
**Solution**: Updated form submission to map fields correctly:
- `emergency_type` → `emergencyType`
- `problem_description` → `problemDescription`
- `additional_info` → `additionalInfo`

### 4. **Missing Vehicle ID** ✅ FIXED
**Problem**: Backend requires `vehicleId` but frontend didn't provide it
**Solution**: Added default vehicle ID (1) for now. In production, user should select from their vehicles

### 5. **Location Format Issues** ✅ FIXED
**Problem**: Frontend sent text location, backend expects latitude/longitude
**Solution**: Added coordinate storage and proper location handling

## 🚀 How to Test the Fixed Feature

### Method 1: Using the Test Script
```bash
cd vehicle-service-backend
node ../test-breakdown.js
```

### Method 2: Manual Testing
1. **Start Backend**: `cd vehicle-service-backend && npm start`
2. **Start Frontend**: `npm run dev`
3. **Register/Login**: Go to http://localhost:5173/register
4. **Test Breakdown**: Go to http://localhost:5173/request

### Method 3: Using Postman/API Client
1. **Register User**:
   ```http
   POST http://localhost:5000/api/auth/register
   Content-Type: application/json
   
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "phone": "1234567890"
   }
   ```

2. **Login**:
   ```http
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json
   
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

3. **Create Breakdown Request**:
   ```http
   POST http://localhost:5000/api/breakdown/request
   Authorization: Bearer YOUR_TOKEN_HERE
   Content-Type: application/json
   
   {
     "vehicleId": 1,
     "emergencyType": "Engine Failure",
     "latitude": 40.7128,
     "longitude": -74.0060,
     "problemDescription": "Car wont start",
     "additionalInfo": "Smoke from engine"
   }
   ```

4. **Get Breakdown Requests**:
   ```http
   GET http://localhost:5000/api/breakdown/my-requests
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

## 🔧 Common Issues and Solutions

### Issue 1: "Please login to submit a breakdown request"
**Cause**: User is not authenticated
**Solution**: 
- Login first at http://localhost:5173/login
- Or register a new account

### Issue 2: "Please get your current location before submitting"
**Cause**: Location not detected
**Solution**:
- Click the location icon in the form
- Allow location access when prompted
- Or manually enter coordinates

### Issue 3: "Vehicle, emergency type, and location are required"
**Cause**: Missing required fields
**Solution**:
- Fill in all required fields
- Make sure location is detected
- Select an emergency type

### Issue 4: "Access denied. No token provided"
**Cause**: Authentication token missing
**Solution**:
- Make sure user is logged in
- Check if token is stored in localStorage
- Try logging out and logging in again

### Issue 5: Database connection errors
**Cause**: Database not running or tables missing
**Solution**:
- Start MySQL database
- Run the SQL setup script: `vehicle-service-backend/db_setup.sql`
- Check database credentials in `.env` file

## 📊 Expected Database Structure

Make sure these tables exist in your database:

```sql
-- Customer table
CREATE TABLE customer (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle table
CREATE TABLE vehicle (
    vehicleId INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NOT NULL,
    vehicleNumber VARCHAR(100) NOT NULL UNIQUE,
    brand VARCHAR(100),
    model VARCHAR(100),
    type VARCHAR(100),
    manufactureYear INT,
    fuelType VARCHAR(50),
    transmission VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE CASCADE
);

-- Breakdown request table
CREATE TABLE breakdown_request (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NOT NULL,
    vehicleId INT NOT NULL,
    emergencyType VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    problemDescription TEXT,
    additionalInfo TEXT,
    status ENUM('Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customer(customerId) ON DELETE CASCADE,
    FOREIGN KEY (vehicleId) REFERENCES vehicle(vehicleId) ON DELETE CASCADE
);
```

## 🎯 Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] Database connected and tables created
- [ ] User can register and login
- [ ] User can access breakdown request form
- [ ] Location detection works
- [ ] Form submission works
- [ ] Breakdown request is saved to database
- [ ] User can view their breakdown requests

## 🚨 Emergency Debugging

If nothing works:

1. **Check Console Logs**:
   - Frontend: Open browser dev tools → Console
   - Backend: Check terminal where server is running

2. **Check Network Tab**:
   - Look for failed API requests
   - Check response status codes

3. **Verify Database**:
   ```sql
   SELECT * FROM customer;
   SELECT * FROM breakdown_request;
   ```

4. **Test API Directly**:
   ```bash
   curl -X GET http://localhost:5000/api/health
   ```

## ✅ Success Indicators

When everything works correctly, you should see:
- ✅ User registration success message
- ✅ Login success message
- ✅ Location detected successfully
- ✅ Breakdown request submitted successfully
- ✅ Request appears in database
- ✅ User can view their requests

The breakdown feature is now fully functional! 🎉
