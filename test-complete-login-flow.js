const axios = require('axios');

async function testCompleteLoginFlow() {
  const credentials = {
    email: 'service_advicer@vehicleservice.com',
    password: 'serviceadvisor123'
  };

  console.log('Testing complete login flow...\n');

  // Step 1: Try customer login (should fail)
  try {
    console.log('1. Trying customer login...');
    const customerResponse = await axios.post('http://localhost:5000/api/auth/login', credentials);
    console.log('✅ Customer login successful (unexpected):', customerResponse.status);
  } catch (customerError) {
    console.log('❌ Customer login failed (expected):', customerError.response?.status, customerError.response?.data?.message);
    
    // Step 2: Try staff login (should succeed)
    try {
      console.log('\n2. Trying staff login...');
      const staffResponse = await axios.post('http://localhost:5000/api/staff/login', credentials);
      console.log('✅ Staff login successful:', staffResponse.status);
      console.log('Response data:', staffResponse.data);
      
      // Decode JWT to verify role
      const token = staffResponse.data.token;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('JWT Payload:', payload);
      console.log('Role:', payload.role);
      
    } catch (staffError) {
      console.log('❌ Staff login failed:', staffError.response?.status, staffError.response?.data?.message);
    }
  }
}

testCompleteLoginFlow();
