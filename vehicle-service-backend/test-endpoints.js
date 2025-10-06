const axios = require('axios');

async function testEndpoints() {
  const credentials = {
    email: 'service_advicer@vehicleservice.com',
    password: 'serviceadvisor123'
  };

  console.log('Testing different endpoints...\n');

  // Test 1: Direct /login endpoint (what the frontend might be using)
  try {
    console.log('1. Testing /login endpoint...');
    const response1 = await axios.post('http://localhost:5000/login', credentials);
    console.log('✅ /login successful:', response1.status);
  } catch (error) {
    console.log('❌ /login failed:', error.response?.status, error.response?.data?.message);
  }

  // Test 2: /api/staff/login endpoint (correct endpoint)
  try {
    console.log('\n2. Testing /api/staff/login endpoint...');
    const response2 = await axios.post('http://localhost:5000/api/staff/login', credentials);
    console.log('✅ /api/staff/login successful:', response2.status);
  } catch (error) {
    console.log('❌ /api/staff/login failed:', error.response?.status, error.response?.data?.message);
  }

  // Test 3: /api/auth/login endpoint (customer endpoint)
  try {
    console.log('\n3. Testing /api/auth/login endpoint...');
    const response3 = await axios.post('http://localhost:5000/api/auth/login', credentials);
    console.log('✅ /api/auth/login successful:', response3.status);
  } catch (error) {
    console.log('❌ /api/auth/login failed:', error.response?.status, error.response?.data?.message);
  }
}

testEndpoints();
