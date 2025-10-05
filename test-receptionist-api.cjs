// Test script for receptionist dashboard API endpoints
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testReceptionistAPI() {
  console.log('Testing Receptionist Dashboard API Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Get today's bookings (should work without auth for now)
    console.log('2. Testing get today\'s bookings...');
    try {
      const bookingsResponse = await axios.get(`${API_BASE_URL}/bookings/today`);
      console.log('✅ Today\'s bookings endpoint working:', bookingsResponse.data.length, 'bookings found');
    } catch (error) {
      console.log('⚠️  Today\'s bookings endpoint error:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 3: Get booking stats
    console.log('3. Testing booking stats...');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/bookings/stats`);
      console.log('✅ Booking stats endpoint working:', statsResponse.data);
    } catch (error) {
      console.log('⚠️  Booking stats endpoint error:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 4: Staff login endpoint
    console.log('4. Testing staff login endpoint...');
    try {
      const staffLoginResponse = await axios.post(`${API_BASE_URL}/staff/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });
      console.log('✅ Staff login endpoint working');
    } catch (error) {
      console.log('⚠️  Staff login endpoint error (expected if no test staff exists):', error.response?.data?.message || error.message);
    }
    console.log('');

    console.log('🎉 API endpoint testing completed!');
    console.log('\nNext steps:');
    console.log('1. Create a test staff member in the database');
    console.log('2. Test staff login functionality');
    console.log('3. Test receptionist dashboard with real data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReceptionistAPI();
