# Google OAuth Popup Troubleshooting Guide

## Issue: Google Popup Window Not Opening

### 🔍 **Common Causes:**

1. **Browser Popup Blocker**
2. **Incorrect Google OAuth Implementation**
3. **CORS Issues**
4. **Google Client ID Issues**
5. **Script Loading Problems**

### 🛠️ **Solutions:**

#### **Solution 1: Check Browser Popup Blocker**
- **Chrome**: Click the popup blocker icon in the address bar and allow popups
- **Firefox**: Go to Settings → Privacy & Security → Permissions → Block pop-up windows
- **Edge**: Go to Settings → Site permissions → Pop-ups and redirects

#### **Solution 2: Test with Simple HTML File**
I've created `test-google-popup.html` for testing:
1. Open the file in your browser
2. Click "Sign in with Google"
3. If popup opens → Issue is in React implementation
4. If popup doesn't open → Issue is with Google Client ID or browser settings

#### **Solution 3: Check Google Client ID Configuration**
Verify your Google Client ID is correct:
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to "Credentials"
- Check OAuth 2.0 Client ID
- Ensure authorized origins include your domain

#### **Solution 4: Update Frontend Implementation**
The current implementation uses `google.accounts.oauth2.initTokenClient()` which should open a popup.

### 🧪 **Testing Steps:**

1. **Test the HTML file**:
   ```bash
   # Open test-google-popup.html in browser
   # Click the Google sign-in button
   # Check if popup opens
   ```

2. **Test in React app**:
   - Go to login page
   - Click Google button
   - Check browser console for errors
   - Check if popup opens

3. **Check browser console**:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for JavaScript errors
   - Look for Google OAuth messages

### 🔧 **Debug Information:**

#### **Check if Google Script is Loaded:**
```javascript
console.log('Google loaded:', !!window.google);
console.log('Google accounts:', !!window.google?.accounts);
```

#### **Check if Client ID is Correct:**
```javascript
console.log('Client ID:', GOOGLE_CONFIG.clientId);
```

#### **Test Popup Manually:**
```javascript
// Test in browser console
const client = google.accounts.oauth2.initTokenClient({
  client_id: 'YOUR_CLIENT_ID',
  scope: 'openid email profile',
  callback: (response) => console.log(response)
});
client.requestAccessToken();
```

### 🚨 **Common Error Messages:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Popup blocked" | Browser popup blocker | Allow popups for your site |
| "Invalid client_id" | Wrong Google Client ID | Check Google Cloud Console |
| "Origin not allowed" | CORS issue | Add domain to authorized origins |
| "Script not loaded" | Google script failed to load | Check network connection |

### 🚀 **Quick Fixes:**

#### **Fix 1: Allow Popups**
- Click popup blocker icon in browser
- Allow popups for your site

#### **Fix 2: Check Google Cloud Console**
- Verify Client ID is correct
- Add `http://localhost:5173` to authorized origins
- Add your production domain to authorized origins

#### **Fix 3: Test with HTML File**
- Open `test-google-popup.html`
- Test if popup works there
- If it works, issue is in React implementation

#### **Fix 4: Check Network Tab**
- Open Developer Tools
- Go to Network tab
- Click Google button
- Look for failed requests to Google

### 📋 **Expected Behavior:**

1. **User clicks Google button**
2. **Popup window opens** with Google sign-in
3. **User selects Google account**
4. **Popup closes automatically**
5. **User is logged in**

### 🔍 **If Popup Still Doesn't Open:**

1. **Check browser console** for errors
2. **Test with different browser**
3. **Check if popup blocker is enabled**
4. **Verify Google Client ID** in Google Cloud Console
5. **Test with the HTML file** I created

The most common issue is browser popup blockers. Make sure to allow popups for your development site!
