// Debug script for Google OAuth issues
// Run with: node debug-google-oauth.js

import fs from 'fs';
import path from 'path';

console.log('🔍 Debugging Google OAuth Configuration...\n');

// Check 1: Backend .env file
console.log('1. Checking backend .env file...');
try {
  const envPath = './vehicle-service-backend/.env';
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const googleClientIdMatch = envContent.match(/GOOGLE_CLIENT_ID=(.+)/);
  if (googleClientIdMatch) {
    const clientId = googleClientIdMatch[1].trim();
    console.log(`   ✅ Google Client ID found: ${clientId}`);
    
    if (clientId.startsWith('http://')) {
      console.log('   ❌ ERROR: Client ID has http:// prefix (should be removed)');
    } else if (clientId.includes('.apps.googleusercontent.com')) {
      console.log('   ✅ Client ID format looks correct');
    } else {
      console.log('   ⚠️  WARNING: Client ID format might be incorrect');
    }
  } else {
    console.log('   ❌ ERROR: GOOGLE_CLIENT_ID not found in .env file');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read .env file:', error.message);
}

// Check 2: Frontend config
console.log('\n2. Checking frontend config...');
try {
  const configPath = './src/config/googleAuth.js';
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('584667634499-3l8mh29qabpqpcjpds7p0p6a5t3gv3bl.apps.googleusercontent.com')) {
    console.log('   ✅ Frontend config has correct Client ID');
  } else {
    console.log('   ❌ ERROR: Frontend config might have wrong Client ID');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read frontend config:', error.message);
}

// Check 3: Package.json dependencies
console.log('\n3. Checking dependencies...');
try {
  const packagePath = './vehicle-service-backend/package.json';
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageContent.dependencies['google-auth-library']) {
    console.log(`   ✅ google-auth-library installed: ${packageContent.dependencies['google-auth-library']}`);
  } else {
    console.log('   ❌ ERROR: google-auth-library not found in dependencies');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read package.json:', error.message);
}

// Check 4: Database schema (check if migration was run)
console.log('\n4. Checking database schema...');
try {
  const dbSetupPath = './vehicle-service-backend/db_setup.sql';
  const dbContent = fs.readFileSync(dbSetupPath, 'utf8');
  
  if (dbContent.includes('googleId') && dbContent.includes('provider')) {
    console.log('   ✅ Database schema includes Google OAuth columns');
  } else {
    console.log('   ❌ ERROR: Database schema missing Google OAuth columns');
  }
} catch (error) {
  console.log('   ❌ ERROR: Could not read database setup file:', error.message);
}

console.log('\n📋 Common Issues and Solutions:');
console.log('1. ❌ "Google Client ID not found" → Check .env file location and format');
console.log('2. ❌ "Invalid token" → Frontend sending wrong token format');
console.log('3. ❌ "Database error" → Run database migration');
console.log('4. ❌ "CORS error" → Check frontend URL in CORS config');
console.log('5. ❌ "Google Auth Library error" → Reinstall google-auth-library');

console.log('\n🚀 Next Steps:');
console.log('1. Restart backend server');
console.log('2. Check backend console for debug messages');
console.log('3. Test Google OAuth and check error details');
console.log('4. If still failing, check browser console for frontend errors');
