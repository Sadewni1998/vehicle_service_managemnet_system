# Testing Breakdown Feature - API Guide

## Prerequisites
- Server running on `http://localhost:5000`
- Database configured and running
- Valid user account for authentication

## Available Endpoints

### 1. Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### 2. Breakdown Endpoints
- `POST /api/breakdown/request` - Create breakdown request (protected)
- `GET /api/breakdown/my-requests` - Get user's breakdown requests (protected)

## Step-by-Step Testing

### Step 1: Register a User (if not already registered)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "phoneNumber": "1234567890"
  }'
```

### Step 2: Login to Get Authentication Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

**Save the token from the response!**

### Step 3: Test Breakdown Request Creation
```bash
curl -X POST http://localhost:5000/api/breakdown/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "vehicleId": 1,
    "emergencyType": "Engine Failure",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "problemDescription": "Car wont start, engine making strange noises",
    "additionalInfo": "Smoke coming from engine bay"
  }'
```

### Step 4: Test Getting User's Breakdown Requests
```bash
curl -X GET http://localhost:5000/api/breakdown/my-requests \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Expected Responses

### Successful Breakdown Request Creation
```json
{
  "message": "Breakdown request submitted successfully!",
  "requestId": 1
}
```

### Successful Get Breakdown Requests
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

## Error Cases to Test

### 1. Missing Authentication Token
```bash
curl -X POST http://localhost:5000/api/breakdown/request \
  -H "Content-Type: application/json" \
  -d '{"vehicleId": 1, "emergencyType": "Test"}'
```
**Expected:** 401 Unauthorized

### 2. Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/breakdown/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"vehicleId": 1}'
```
**Expected:** 400 Bad Request with validation message

### 3. Invalid Token
```bash
curl -X GET http://localhost:5000/api/breakdown/my-requests \
  -H "Authorization: Bearer invalid_token"
```
**Expected:** 401 Unauthorized

## Using Postman/Insomnia

1. **Base URL:** `http://localhost:5000`
2. **Headers for protected routes:**
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN_HERE`

3. **Test Collection:**
   - Register User
   - Login User
   - Create Breakdown Request
   - Get My Breakdown Requests

## Database Verification

Check the `breakdown_request` table to verify data is being stored:
```sql
SELECT * FROM breakdown_request ORDER BY createdAt DESC;
```

## Troubleshooting

1. **Server not starting:** Check if port 5000 is available
2. **Database errors:** Verify database connection and table structure
3. **Authentication errors:** Ensure JWT_SECRET is set in .env file
4. **CORS errors:** Check frontend URL configuration in .env

