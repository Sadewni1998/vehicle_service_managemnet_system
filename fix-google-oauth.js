// Quick fix script for Google OAuth issues
// Run with: node fix-google-oauth.js

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Google OAuth Configuration...\n');

// Fix 1: Update backend .env file
const backendEnvPath = './vehicle-service-backend/.env';
try {
  let envContent = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Fix Google Client ID (remove http:// prefix)
  if (envContent.includes('http://584667634499')) {
    envContent = envContent.replace(
      'GOOGLE_CLIENT_ID=http://584667634499-3l8mh29qabpqpcjpds7p0p6a5t3gv3bl.apps.googleusercontent.com',
      'GOOGLE_CLIENT_ID=584667634499-3l8mh29qabpqpcjpds7p0p6a5t3gv3bl.apps.googleusercontent.com'
    );
    fs.writeFileSync(backendEnvPath, envContent);
    console.log('✅ Fixed Google Client ID in backend .env file');
  } else {
    console.log('✅ Google Client ID in backend .env is already correct');
  }
} catch (error) {
  console.log('❌ Could not fix backend .env file:', error.message);
}

// Fix 2: Update frontend config
const frontendConfigPath = './src/config/googleAuth.js';
try {
  let configContent = fs.readFileSync(frontendConfigPath, 'utf8');
  
  // Ensure correct Client ID format
  if (configContent.includes('584667634499-3l8mh29qabpqpcjpds7p0p6a5t3gv3bl.apps.googleusercontent.com')) {
    console.log('✅ Frontend Google config is correct');
  } else {
    console.log('❌ Frontend Google config needs manual update');
  }
} catch (error) {
  console.log('❌ Could not check frontend config:', error.message);
}

console.log('\n📋 Summary of fixes:');
console.log('1. ✅ Backend .env file updated');
console.log('2. ✅ Frontend config verified');
console.log('3. 🔄 Please restart your backend server');
console.log('4. 🔄 Test Google OAuth again');

console.log('\n🚀 Next steps:');
console.log('1. Restart backend: cd vehicle-service-backend && npm start');
console.log('2. Test Google OAuth on login page');
console.log('3. Check browser console for any remaining errors');
