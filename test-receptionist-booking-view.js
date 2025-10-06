// Test script to verify receptionist booking view functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testReceptionist = {
  email: 'receptionist@test.com',
  password: 'password'
};

async function testReceptionistBookingView() {
  try {
    console.log('🧪 Testing Receptionist Booking View Functionality...\n');

    // Step 1: Login as receptionist
    console.log('1. Logging in as receptionist...');
    const loginResponse = await axios.post(`${API_BASE_URL}/staff/login`, testReceptionist);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Set up axios with auth token
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test get all bookings
    console.log('2. Testing get all bookings...');
    try {
      const allBookingsResponse = await authAxios.get('/bookings');
      console.log(`✅ Retrieved ${allBookingsResponse.data.length} bookings`);
      console.log('Sample booking:', JSON.stringify(allBookingsResponse.data[0], null, 2));
    } catch (error) {
      console.log('❌ Error getting all bookings:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Step 3: Test get today's bookings
    console.log('3. Testing get today\'s bookings...');
    try {
      const todayBookingsResponse = await authAxios.get('/bookings/today');
      console.log(`✅ Retrieved ${todayBookingsResponse.data.length} today's bookings`);
      if (todayBookingsResponse.data.length > 0) {
        console.log('Sample today booking:', JSON.stringify(todayBookingsResponse.data[0], null, 2));
      }
    } catch (error) {
      console.log('❌ Error getting today\'s bookings:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Step 4: Test get booking by ID (if bookings exist)
    console.log('4. Testing get booking by ID...');
    try {
      const allBookingsResponse = await authAxios.get('/bookings');
      if (allBookingsResponse.data.length > 0) {
        const bookingId = allBookingsResponse.data[0].bookingId || allBookingsResponse.data[0].id;
        const bookingDetailsResponse = await authAxios.get(`/bookings/${bookingId}`);
        console.log('✅ Retrieved booking details by ID');
        console.log('Booking details:', JSON.stringify(bookingDetailsResponse.data, null, 2));
      } else {
        console.log('⚠️  No bookings found to test get by ID');
      }
    } catch (error) {
      console.log('❌ Error getting booking by ID:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Step 5: Test booking statistics
    console.log('5. Testing booking statistics...');
    try {
      const statsResponse = await authAxios.get('/bookings/stats');
      console.log('✅ Retrieved booking statistics');
      console.log('Stats:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error getting booking statistics:', error.response?.data?.message || error.message);
    }
    console.log('');

    console.log('🎉 Receptionist booking view functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testReceptionistBookingView();
