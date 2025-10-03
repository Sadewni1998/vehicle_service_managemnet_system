// Test script for authentication (registration and login)
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testAuthentication() {
  try {
    console.log('🚀 Testing Authentication System...\n');

    // Test 1: Register a new user
    console.log('1. Testing User Registration...');
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      address: 'Test Address',
      vehicles: []
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration successful');
      console.log('Response:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  User already exists, continuing with login test...');
      } else {
        throw error;
      }
    }

    // Test 2: Login
    console.log('\n2. Testing User Login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful');
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('User:', loginResponse.data.user);

    // Test 3: Test with invalid credentials
    console.log('\n3. Testing Invalid Login...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed with invalid password');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // Test 4: Test registration with missing fields
    console.log('\n4. Testing Registration with Missing Fields...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User 2',
        email: 'test2@example.com'
        // Missing password
      });
      console.log('❌ Should have failed with missing password');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Missing fields correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    console.log('\n🎉 Authentication tests completed!');

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
testAuthentication();
