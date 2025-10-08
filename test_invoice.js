// Simple test script to verify invoice generation
const axios = require('axios');

async function testInvoiceGeneration() {
  try {
    console.log('Testing invoice generation...');
    
    // Test with booking ID 3 (Michael Chen's booking)
    const response = await axios.get('http://localhost:5000/api/invoices/3/generate', {
      responseType: 'blob'
    });
    
    console.log('Invoice generated successfully!');
    console.log('Response headers:', response.headers);
    console.log('Response size:', response.data.length, 'bytes');
    
    // Save the PDF to a file for verification
    const fs = require('fs');
    fs.writeFileSync('test_invoice.pdf', response.data);
    console.log('Invoice saved as test_invoice.pdf');
    
  } catch (error) {
    console.error('Error testing invoice generation:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testInvoiceGeneration();
