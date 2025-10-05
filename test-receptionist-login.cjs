// Test script for receptionist login and dashboard functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testReceptionistLogin() {
  console.log('Testing Receptionist Login and Dashboard...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Staff login
    console.log('2. Testing staff login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/staff/login`, {
      email: 'receptionist@test.com',
      password: 'receptionist123'
    });
    
    console.log('✅ Staff login successful!');
    console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
    const token = loginResponse.data.token;
    console.log('');

    // Test 3: Get today's bookings with authentication
    console.log('3. Testing get today\'s bookings with auth...');
    const bookingsResponse = await axios.get(`${API_BASE_URL}/bookings/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Today\'s bookings retrieved:', bookingsResponse.data.length, 'bookings found');
    console.log('Sample booking:', bookingsResponse.data[0]);
    console.log('');

    // Test 4: Get booking stats
    console.log('4. Testing booking stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/bookings/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Booking stats retrieved:', statsResponse.data);
    console.log('');

    // Test 5: Update booking status
    if (bookingsResponse.data.length > 0) {
      console.log('5. Testing update booking status...');
      const firstBooking = bookingsResponse.data[0];
      const updateResponse = await axios.put(`${API_BASE_URL}/bookings/${firstBooking.id}/status`, 
        { status: 'arrived' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('✅ Booking status updated:', updateResponse.data.message);
      console.log('');
    }

    console.log('🎉 All receptionist dashboard tests passed!');
    console.log('\n📋 Test Credentials:');
    console.log('Email: receptionist@test.com');
    console.log('Password: receptionist123');
    console.log('Role: receptionist');
    console.log('\n📋 Additional Test Credentials:');
    console.log('Manager - Email: manager@test.com, Password: receptionist123');
    console.log('Mechanic - Email: mechanic@test.com, Password: receptionist123');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure to run the SQL script first to create test data:');
      console.log('mysql -u your_username -p vehicle_service_db < create-test-receptionist.sql');
    }
  }
}

// Run the test
testReceptionistLogin();
