// Test script for public breakdown service (no authentication required)
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testPublicBreakdownAPI() {
  try {
    console.log('🚀 Testing Public Breakdown API...\n');

    // Test breakdown request creation without authentication
    console.log('1. Creating breakdown request (no authentication required)...');
    const breakdownData = {
      name: 'John Doe',
      phone: '0712345678',
      vehicleNumber: 'ABC-1234',
      vehicleType: 'sedan',
      emergencyType: 'engine failure',
      latitude: 6.9271,
      longitude: 79.8612,
      problemDescription: 'Car wont start, engine making strange noises',
      additionalInfo: 'Smoke coming from engine bay'
    };

    const breakdownResponse = await axios.post(`${BASE_URL}/breakdown/request`, breakdownData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Breakdown request created successfully:', breakdownResponse.data);

    console.log('\n🎉 Public breakdown service test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Public breakdown request creation: ✅');
    console.log('- No authentication required: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 5000');
    }
    process.exit(1);
  }
}

// Run the tests
testPublicBreakdownAPI();
