# Breakdown Feature Testing Guide

## ✅ Server Status
Your server is running successfully on `http://localhost:5000`

## 🧪 How to Test the Breakdown Feature

### Method 1: Using PowerShell/Command Line

#### Step 1: Register a User
```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
    phone = "1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

#### Step 2: Login to Get Token
```powershell
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

#### Step 3: Create Breakdown Request
```powershell
$breakdownBody = @{
    vehicleId = 1
    emergencyType = "Engine Failure"
    latitude = 40.7128
    longitude = -74.0060
    problemDescription = "Car wont start, engine making strange noises"
    additionalInfo = "Smoke coming from engine bay"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/breakdown/request" -Method POST -Body $breakdownBody -Headers $headers
```

#### Step 4: Get User's Breakdown Requests
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/breakdown/my-requests" -Method GET -Headers $headers
```

### Method 2: Using Postman/Insomnia

1. **Base URL:** `http://localhost:5000`

2. **Register User:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/register`
   - Body (JSON):
   ```json
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "phone": "1234567890"
   }
   ```

3. **Login:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   - **Save the token from response!**

4. **Create Breakdown Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/breakdown/request`
   - Headers:
     - `Authorization: Bearer YOUR_TOKEN_HERE`
     - `Content-Type: application/json`
   - Body (JSON):
   ```json
   {
     "vehicleId": 1,
     "emergencyType": "Engine Failure",
     "latitude": 40.7128,
     "longitude": -74.0060,
     "problemDescription": "Car wont start, engine making strange noises",
     "additionalInfo": "Smoke coming from engine bay"
   }
   ```

5. **Get Breakdown Requests:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/breakdown/my-requests`
   - Headers:
     - `Authorization: Bearer YOUR_TOKEN_HERE`

### Method 3: Using Browser (for GET requests only)

1. First, get a token using Postman/PowerShell
2. Then visit: `http://localhost:5000/api/breakdown/my-requests`
   - Add header: `Authorization: Bearer YOUR_TOKEN_HERE`

## 🔍 Expected Responses

### Successful Registration
```json
{
  "message": "User registered successfully",
  "customerId": 1
}
```

### Successful Login
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customerId": 1
}
```

### Successful Breakdown Request
```json
{
  "message": "Breakdown request submitted successfully!",
  "requestId": 1
}
```

### Successful Get Requests
```json
{
  "success": true,
  "message": "Found 1 breakdown request(s).",
  "data": [
    {
      "id": 1,
      "customerId": 1,
      "vehicleId": 1,
      "emergencyType": "Engine Failure",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "problemDescription": "Car wont start, engine making strange noises",
      "additionalInfo": "Smoke coming from engine bay",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## ❌ Error Testing

### Test 1: No Authentication
```powershell
$body = @{
    vehicleId = 1
    emergencyType = "Test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/breakdown/request" -Method POST -Body $body -ContentType "application/json"
```
**Expected:** 401 Unauthorized

### Test 2: Missing Required Fields
```powershell
$body = @{
    vehicleId = 1
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/breakdown/request" -Method POST -Body $body -Headers $headers
```
**Expected:** 400 Bad Request

## 🗄️ Database Verification

Check your database to see if data is being stored:

```sql
-- Check if user was created
SELECT * FROM customer WHERE email = 'test@example.com';

-- Check if breakdown request was created
SELECT * FROM breakdown_request ORDER BY createdAt DESC;
```

## 🚀 Quick Test Script

Save this as `quick-test.ps1` and run it:

```powershell
# Quick Breakdown API Test
$baseUrl = "http://localhost:5000"

# Register
$user = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
    phone = "1234567890"
} | ConvertTo-Json

Write-Host "1. Registering user..."
$registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $user -ContentType "application/json"
Write-Host "✅ User registered"

# Login
$login = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "2. Logging in..."
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $login -ContentType "application/json"
$token = $loginResponse.token
Write-Host "✅ Login successful"

# Create breakdown request
$breakdown = @{
    vehicleId = 1
    emergencyType = "Engine Failure"
    latitude = 40.7128
    longitude = -74.0060
    problemDescription = "Test breakdown"
    additionalInfo = "Test info"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "3. Creating breakdown request..."
$breakdownResponse = Invoke-RestMethod -Uri "$baseUrl/api/breakdown/request" -Method POST -Body $breakdown -Headers $headers
Write-Host "✅ Breakdown request created: $($breakdownResponse.message)"

# Get requests
Write-Host "4. Getting breakdown requests..."
$requestsResponse = Invoke-RestMethod -Uri "$baseUrl/api/breakdown/my-requests" -Method GET -Headers @{"Authorization" = "Bearer $token"}
Write-Host "✅ Found $($requestsResponse.data.Count) breakdown requests"

Write-Host "🎉 All tests completed successfully!"
```

## 📝 Notes

- Make sure your database is running and accessible
- Ensure the `breakdown_request` table exists in your database
- The server must be running on port 5000
- All breakdown endpoints require authentication
- Test with different emergency types: "Engine Failure", "Flat Tire", "Battery Dead", "Accident", etc.

