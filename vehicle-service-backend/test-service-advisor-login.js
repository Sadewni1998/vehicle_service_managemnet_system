const axios = require('axios');

async function testServiceAdvisorLogin() {
  try {
    const credentials = {
      email: 'service_advicer@vehicleservice.com',
      password: 'serviceadvisor123'
    };

    console.log('Testing service advisor login...');
    console.log('Credentials:', credentials);

    // Test the staff login endpoint
    const response = await axios.post('http://localhost:5000/api/staff/login', credentials);
    
    console.log('✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Decode the JWT token to see the payload
    const token = response.data.token;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('JWT Payload:', payload);
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    console.log('Full error:', error.response?.data);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Backend server is not running!');
      console.log('Please start the backend server with: npm start');
    }
  }
}

testServiceAdvisorLogin();
