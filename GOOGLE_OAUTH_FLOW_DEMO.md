# Google OAuth Flow Demo

## How It Works When User Clicks Google Button

### 1. **User Clicks Google Button on Login Page**
- Frontend loads Google OAuth script
- User sees Google sign-in popup

### 2. **User Authorizes with Google**
- User selects Google account
- Google returns access token with user info

### 3. **Frontend Sends Token to Backend**
```javascript
// Frontend sends Google token to backend
const response = await authAPI.googleSignIn(googleToken)
```

### 4. **Backend Processing**
```javascript
// Backend verifies token with Google
const ticket = await client.verifyIdToken({
  idToken: token,
  audience: process.env.GOOGLE_CLIENT_ID,
});
const payload = ticket.getPayload();
const { sub: googleId, name, email } = payload;
```

### 5. **Check if User Exists**
```javascript
// Check if email already exists in database
const [rows] = await db.query("SELECT * FROM customer WHERE email = ?", [email]);
let customer = rows[0];
```

### 6. **Two Scenarios:**

#### **Scenario A: User Already Exists (Login)**
- If email found in database → User logs in
- Returns JWT token for existing user
- User is redirected to dashboard

#### **Scenario B: New User (Registration)**
- If email NOT found → Create new user
```javascript
// Create new user in database
const newUserSql = `
  INSERT INTO customer (name, email, googleId, provider) 
  VALUES (?, ?, ?, 'google')
`;
const [result] = await db.query(newUserSql, [name, email, googleId]);
```

### 7. **Return JWT Token**
- Backend creates JWT token for user
- Returns token + user data to frontend
- Frontend stores token and user data
- User is logged in and redirected

## Database Schema Support

The `customer` table supports both registration methods:

```sql
CREATE TABLE customer (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,           -- NULL for Google users
    phone VARCHAR(20),
    address TEXT,
    googleId VARCHAR(255) UNIQUE NULL,    -- Google user ID
    provider VARCHAR(50) NOT NULL DEFAULT 'local', -- 'local' or 'google'
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## User Experience

### For New Users:
1. Click "Google" button
2. Authorize with Google
3. **Automatically registered** in system
4. **Automatically logged in**
5. Redirected to dashboard

### For Existing Users:
1. Click "Google" button  
2. Authorize with Google
3. **Automatically logged in**
4. Redirected to dashboard

## Security Features

- ✅ Google token verification
- ✅ JWT token generation
- ✅ Secure user data storage
- ✅ Provider tracking (local vs google)
- ✅ Email uniqueness enforcement

## Testing the Flow

1. **Start servers**: Frontend (port 5173) + Backend (port 5000)
2. **Go to Login page**: `http://localhost:5173/login`
3. **Click Google button**: Should open Google OAuth popup
4. **Complete authorization**: User gets logged in/registered automatically
5. **Check database**: User should be in `customer` table with `provider='google'`

The system handles both login and registration seamlessly through the same Google OAuth flow!
