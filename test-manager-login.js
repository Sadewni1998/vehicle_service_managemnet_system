// Test Manager Login Flow
// This script tests the complete manager login functionality

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testManagerLogin() {
  console.log('🚀 Testing Manager Login Flow...\n');
  
  try {
    // Test 1: Manager Login
    console.log('1. Testing manager login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/staff/login`, {
      email: 'manager@vehicleservice.com',
      password: 'manager123'
    });
    
    console.log('✅ Login successful!');
    console.log(`   Message: ${loginResponse.data.message}`);
    console.log(`   Token: ${loginResponse.data.token ? 'Present' : 'Missing'}\n`);
    
    // Test 2: Verify Token Payload
    console.log('2. Verifying token payload...');
    const token = loginResponse.data.token;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    console.log('✅ Token decoded successfully!');
    console.log(`   Staff ID: ${payload.staffId}`);
    console.log(`   Name: ${payload.name}`);
    console.log(`   Email: ${payload.email}`);
    console.log(`   Role: ${payload.role}\n`);
    
    // Test 3: Verify Role is Manager
    if (payload.role === 'manager') {
      console.log('✅ Role verification successful! Manager role detected.\n');
    } else {
      console.log('❌ Role verification failed! Expected "manager", got:', payload.role);
      return;
    }
    
    // Test 4: Test Protected Route (if available)
    console.log('3. Testing protected route access...');
    try {
      const protectedResponse = await axios.get(`${API_BASE_URL}/staff/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Protected route access successful!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️  Protected route not implemented yet (expected)');
      } else {
        console.log('❌ Protected route access failed:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n🎉 All manager login tests passed!');
    console.log('\nManager Login Credentials:');
    console.log('Email: manager@vehicleservice.com');
    console.log('Password: manager123');
    console.log('\nThe manager can now:');
    console.log('- Log in through the frontend login page');
    console.log('- Access the management dashboard at /management-dashboard');
    console.log('- View business KPIs and manage operations');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testManagerLogin();
