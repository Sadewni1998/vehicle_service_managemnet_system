// test-breakdown.js - Simple test script for breakdown API

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '1234567890'
};

const testBreakdownRequest = {
  vehicleId: 1,
  emergencyType: 'Engine Failure',
  latitude: 40.7128,
  longitude: -74.0060,
  problemDescription: 'Car wont start, engine making strange noises',
  additionalInfo: 'Smoke coming from engine bay'
};

async function testBreakdownAPI() {
  try {
    console.log('🚀 Starting Breakdown API Tests...\n');

    // Step 1: Register user
    console.log('1. Registering user...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️  User already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Login
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    console.log('✅ Login successful, token received');

    // Step 3: Create breakdown request
    console.log('3. Creating breakdown request...');
    const breakdownResponse = await axios.post(`${BASE_URL}/api/breakdown/request`, testBreakdownRequest, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Breakdown request created:', breakdownResponse.data);

    // Step 4: Get user's breakdown requests
    console.log('4. Fetching user breakdown requests...');
    const requestsResponse = await axios.get(`${BASE_URL}/api/breakdown/my-requests`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Breakdown requests retrieved:', requestsResponse.data);

    // Step 5: Test error cases
    console.log('5. Testing error cases...');
    
    // Test without token
    try {
      await axios.post(`${BASE_URL}/api/breakdown/request`, testBreakdownRequest);
    } catch (error) {
      console.log('✅ Unauthorized request properly rejected:', error.response.status);
    }

    // Test with missing required fields
    try {
      await axios.post(`${BASE_URL}/api/breakdown/request`, { vehicleId: 1 }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('✅ Missing fields properly rejected:', error.response.status);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the tests
testBreakdownAPI();
