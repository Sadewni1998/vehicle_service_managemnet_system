// Quick test script for breakdown feature
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testBreakdownFeature() {
  try {
    console.log('🚀 Testing Breakdown Feature...\n');

    // Step 1: Register a user
    console.log('1. Registering user...');
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: 'Test Address'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ User registered successfully');
    console.log('User ID:', registerResponse.data.user.id);

    // Step 2: Login to get token
    console.log('\n2. Logging in...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');

    // Step 3: Create breakdown request
    console.log('\n3. Creating breakdown request...');
    const breakdownData = {
      vehicleId: 1,
      emergencyType: 'Engine Failure',
      latitude: 40.7128,
      longitude: -74.0060,
      problemDescription: 'Car wont start, engine making strange noises',
      additionalInfo: 'Smoke coming from engine bay'
    };

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const breakdownResponse = await axios.post(`${BASE_URL}/breakdown/request`, breakdownData, { headers });
    console.log('✅ Breakdown request created successfully');
    console.log('Request ID:', breakdownResponse.data.requestId);

    // Step 4: Get user's breakdown requests
    console.log('\n4. Getting breakdown requests...');
    const requestsResponse = await axios.get(`${BASE_URL}/breakdown/my-requests`, { headers });
    console.log('✅ Retrieved breakdown requests');
    console.log('Number of requests:', requestsResponse.data.data.length);
    console.log('Latest request:', requestsResponse.data.data[0]);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- User registration: ✅');
    console.log('- User login: ✅');
    console.log('- Breakdown request creation: ✅');
    console.log('- Breakdown request retrieval: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure the user is properly authenticated');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Tip: Check if all required fields are provided');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Tip: Check if the database is running and tables exist');
    }
  }
}

// Run the test
testBreakdownFeature();
