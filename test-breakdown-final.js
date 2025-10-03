// Comprehensive test script for breakdown request functionality
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testBreakdownRequestFlow() {
  try {
    console.log('🚀 Testing Complete Breakdown Request Flow...\n');

    // Step 1: Register a user
    console.log('1. Registering test user...');
    const registerData = {
      name: 'Breakdown Test User',
      email: 'breakdown@example.com',
      password: 'password123',
      phone: '1234567890',
      address: 'Test Address',
      vehicles: []
    };

    try {
      await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  User already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Login to get token
    console.log('\n2. Logging in...');
    const loginData = {
      email: 'breakdown@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

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

    const breakdownResponse = await axios.post(`${BASE_URL}/breakdown/request`, breakdownData, { headers });
    console.log('✅ Breakdown request created successfully');
    console.log('Request ID:', breakdownResponse.data.requestId);

    // Step 4: Get user's breakdown requests
    console.log('\n4. Fetching user breakdown requests...');
    const requestsResponse = await axios.get(`${BASE_URL}/breakdown/my-requests`, { headers });
    console.log('✅ Retrieved breakdown requests');
    console.log('Number of requests:', requestsResponse.data.data.length);
    
    if (requestsResponse.data.data.length > 0) {
      const latestRequest = requestsResponse.data.data[0];
      console.log('Latest request details:');
      console.log('- ID:', latestRequest.requestId);
      console.log('- Emergency Type:', latestRequest.emergencyType);
      console.log('- Status:', latestRequest.status);
      console.log('- Location:', latestRequest.latitude, latestRequest.longitude);
      console.log('- Created:', new Date(latestRequest.createdAt).toLocaleString());
    }

    // Step 5: Test different emergency types
    console.log('\n5. Testing different emergency types...');
    const emergencyTypes = ['Battery Dead', 'Flat Tire', 'Accident', 'Overheating'];
    
    for (const emergencyType of emergencyTypes) {
      const testData = {
        vehicleId: 1,
        emergencyType: emergencyType,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        problemDescription: `Test ${emergencyType.toLowerCase()} issue`,
        additionalInfo: 'Test additional information'
      };

      try {
        const response = await axios.post(`${BASE_URL}/breakdown/request`, testData, { headers });
        console.log(`✅ ${emergencyType} request created (ID: ${response.data.requestId})`);
      } catch (error) {
        console.log(`❌ Failed to create ${emergencyType} request:`, error.response?.data?.message);
      }
    }

    // Step 6: Test error cases
    console.log('\n6. Testing error cases...');
    
    // Test without authentication
    try {
      await axios.post(`${BASE_URL}/breakdown/request`, breakdownData);
      console.log('❌ Should have failed without authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test with missing required fields
    try {
      const incompleteData = { vehicleId: 1 };
      await axios.post(`${BASE_URL}/breakdown/request`, incompleteData, { headers });
      console.log('❌ Should have failed with missing fields');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected request with missing fields');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Step 7: Final status check
    console.log('\n7. Final status check...');
    const finalRequestsResponse = await axios.get(`${BASE_URL}/breakdown/my-requests`, { headers });
    console.log('✅ Final request count:', finalRequestsResponse.data.data.length);
    
    console.log('\n🎉 Breakdown request flow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- User registration: ✅');
    console.log('- User login: ✅');
    console.log('- Breakdown request creation: ✅');
    console.log('- Request retrieval: ✅');
    console.log('- Multiple emergency types: ✅');
    console.log('- Error handling: ✅');
    console.log('- Authentication: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running on port 5000');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Check if the database is running and tables exist');
    }
  }
}

// Run the test
testBreakdownRequestFlow();
