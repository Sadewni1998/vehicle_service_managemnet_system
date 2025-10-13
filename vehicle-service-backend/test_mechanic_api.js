const axios = require('axios');

async function testMechanicAPI() {
  try {
    console.log('Testing mechanic jobcard API...');
    
    // Test the API endpoint
    const response = await axios.get('http://localhost:5000/api/jobcards/mechanic/1');
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    
    // Check if bookingStatus is included
    if (response.data.data && response.data.data.length > 0) {
      const jobcard = response.data.data[0];
      console.log('\nJobcard booking status:', jobcard.bookingStatus);
      console.log('Jobcard status:', jobcard.status);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMechanicAPI();
