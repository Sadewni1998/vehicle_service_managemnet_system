const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testMechanicLogin() {
  console.log('🔧 Testing Mechanic Login Functionality...\n');

  try {
    // Test mechanic login with the test credentials from database
    const loginData = {
      email: 'mechanic@vehicleservice.com',
      password: 'mechanic123'
    };

    console.log('📧 Attempting to login with mechanic credentials...');
    console.log(`Email: ${loginData.email}`);
    console.log(`Password: ${loginData.password}\n`);

    const response = await axios.post(`${API_BASE_URL}/staff/login`, loginData);
    
    console.log('✅ Mechanic login successful!');
    console.log('📋 Response data:');
    console.log(`   Message: ${response.data.message}`);
    console.log(`   Token: ${response.data.token ? 'Token received' : 'No token'}`);
    
    // Decode the JWT token to verify the role
    if (response.data.token) {
      const tokenParts = response.data.token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      console.log('\n🔍 Token payload:');
      console.log(`   Staff ID: ${payload.staffId}`);
      console.log(`   Email: ${payload.email}`);
      console.log(`   Name: ${payload.name}`);
      console.log(`   Role: ${payload.role}`);
      console.log(`   Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
      
      if (payload.role === 'mechanic') {
        console.log('\n✅ Role verification successful - User is a mechanic!');
      } else {
        console.log(`\n❌ Role verification failed - Expected 'mechanic', got '${payload.role}'`);
      }
    }

  } catch (error) {
    console.error('❌ Mechanic login failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

async function testInvalidCredentials() {
  console.log('\n🔒 Testing invalid credentials...\n');

  try {
    const invalidData = {
      email: 'mechanic@vehicleservice.com',
      password: 'wrongpassword'
    };

    await axios.post(`${API_BASE_URL}/staff/login`, invalidData);
    console.log('❌ Login should have failed with invalid credentials!');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Invalid credentials properly rejected');
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

async function testNonExistentUser() {
  console.log('\n👤 Testing non-existent user...\n');

  try {
    const nonExistentData = {
      email: 'nonexistent@vehicleservice.com',
      password: 'password123'
    };

    await axios.post(`${API_BASE_URL}/staff/login`, nonExistentData);
    console.log('❌ Login should have failed with non-existent user!');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Non-existent user properly rejected');
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Mechanic Login Tests\n');
  console.log('=' .repeat(50));
  
  await testMechanicLogin();
  await testInvalidCredentials();
  await testNonExistentUser();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 All tests completed!');
}

// Run the tests
runAllTests().catch(console.error);
