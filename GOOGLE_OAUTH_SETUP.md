# Google OAuth Setup Guide

## Overview
This guide explains how to set up Google OAuth authentication for the Vehicle Service Management System.

## What's Implemented

### Backend (✅ Complete)
- Google OAuth controller with token verification
- Database schema updated to support Google users
- API endpoint: `POST /api/auth/google`
- Environment configuration for Google Client ID

### Frontend (✅ Complete)
- Google OAuth hook (`useGoogleAuth`)
- Google sign-in buttons on Login and Register pages
- Integration with AuthContext
- API method for Google authentication

## Setup Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized origins:
   - `http://localhost:5173` (for development)
   - Your production domain
7. Copy the Client ID

### 2. Backend Configuration
Update `vehicle-service-backend/.env`:
```env
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### 3. Frontend Configuration
Update `src/config/googleAuth.js`:
```javascript
export const GOOGLE_CONFIG = {
  clientId: 'your_actual_google_client_id_here',
  scope: 'email profile'
}
```

### 4. Database Setup
Run the database migration to add Google OAuth support:
```sql
ALTER TABLE customer
    MODIFY COLUMN password VARCHAR(255) NULL,
    ADD COLUMN googleId VARCHAR(255) UNIQUE NULL,
    ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'local';
```

## How It Works

### User Flow
1. User clicks "Google" button on Login/Register page
2. Google OAuth popup opens
3. User authorizes the application
4. Frontend receives Google access token
5. Frontend calls backend `/api/auth/google` with token
6. Backend verifies token with Google
7. Backend creates/finds user and returns JWT
8. User is logged in

### Technical Details
- Uses Google Identity Services (GSI) for frontend
- Backend uses `google-auth-library` for token verification
- Supports both new user registration and existing user login
- Stores Google ID and provider type in database

## Testing

### Manual Testing
1. Start both frontend and backend servers
2. Go to Login or Register page
3. Click "Google" button
4. Complete Google OAuth flow
5. Verify user is logged in and redirected

### API Testing
```bash
# Test Google sign-in endpoint
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "google_id_token_here"}'
```

## Troubleshooting

### Common Issues
1. **"Google OAuth not loaded"**: Check if Google script is loading properly
2. **"Invalid client ID"**: Verify Google Client ID in both frontend and backend
3. **CORS errors**: Ensure frontend URL is added to Google OAuth authorized origins
4. **Database errors**: Make sure database migration has been run

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify Google Client ID configuration
3. Check backend logs for authentication errors
4. Ensure database schema is updated

## Security Notes
- Google Client ID is public (safe to expose in frontend)
- Backend verifies all tokens with Google
- JWT tokens are used for session management
- Passwords are optional for Google users

## Production Deployment
1. Update Google OAuth authorized origins with production domain
2. Use environment variables for configuration
3. Ensure HTTPS is enabled
4. Update CORS settings for production domain
