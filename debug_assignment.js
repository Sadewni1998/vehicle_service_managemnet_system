// Debug script to test assignment functionality
const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugAssignment() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vehicle_service_db'
    });

    console.log('Connected to database');

    // Check if booking exists
    console.log('1. Checking booking...');
    const [bookings] = await connection.execute('SELECT * FROM booking WHERE bookingId = 3');
    console.log(`   Found ${bookings.length} bookings with ID 3`);
    if (bookings.length > 0) {
      console.log(`   Booking: ${bookings[0].vehicleNumber} - ${bookings[0].name}`);
    }

    // Check if mechanic exists
    console.log('\n2. Checking mechanic...');
    const [mechanics] = await connection.execute('SELECT * FROM mechanic WHERE mechanicId = 1');
    console.log(`   Found ${mechanics.length} mechanics with ID 1`);
    if (mechanics.length > 0) {
      console.log(`   Mechanic: ${mechanics[0].mechanicCode} - ${mechanics[0].availability}`);
    }

    // Check jobcard table structure
    console.log('\n3. Checking jobcard table structure...');
    const [jobcardStructure] = await connection.execute('DESCRIBE jobcard');
    console.log('   Jobcard table columns:');
    jobcardStructure.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check jobcardMechanic table structure
    console.log('\n4. Checking jobcardMechanic table structure...');
    const [jobcardMechanicStructure] = await connection.execute('DESCRIBE jobcardMechanic');
    console.log('   JobcardMechanic table columns:');
    jobcardMechanicStructure.forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Test creating a jobcard entry
    console.log('\n5. Testing jobcard creation...');
    try {
      const [result] = await connection.execute(
        `INSERT INTO jobcard (mechanicId, bookingId, partCode, status, serviceDetails) 
         VALUES (?, ?, ?, 'open', ?)`,
        [1, 3, 'GENERAL_SERVICE', '["Oil Change", "Brake Inspection"]']
      );
      console.log(`   ✅ Jobcard created with ID: ${result.insertId}`);
      
      // Test creating jobcardMechanic entry
      const [mechanicResult] = await connection.execute(
        `INSERT INTO jobcardMechanic (jobcardId, mechanicId) 
         VALUES (?, ?)`,
        [result.insertId, 1]
      );
      console.log(`   ✅ JobcardMechanic created with ID: ${mechanicResult.insertId}`);
      
      // Clean up test data
      await connection.execute('DELETE FROM jobcardMechanic WHERE jobcardId = ?', [result.insertId]);
      await connection.execute('DELETE FROM jobcard WHERE jobcardId = ?', [result.insertId]);
      console.log('   ✅ Test data cleaned up');
      
    } catch (error) {
      console.log(`   ❌ Error creating jobcard: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

debugAssignment();
