// Script to check the current database structure
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vehicle_service_db'
    });

    console.log('🔗 Connected to database successfully!');
    console.log('📋 Checking booking table structure...\n');

    // Get all columns from booking table
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'booking'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'vehicle_service_db']);

    console.log('📊 Booking Table Columns:');
    console.log('=' .repeat(80));
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(20)} | ${col.DATA_TYPE.padEnd(15)} | ${col.IS_NULLABLE.padEnd(3)} | ${col.COLUMN_DEFAULT || 'NULL'.padEnd(10)} | ${col.COLUMN_KEY}`);
    });

    // Check constraints
    console.log('\n🔒 Table Constraints:');
    console.log('=' .repeat(50));
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'booking'
    `, [process.env.DB_NAME || 'vehicle_service_db']);

    constraints.forEach(constraint => {
      console.log(`${constraint.CONSTRAINT_NAME} - ${constraint.CONSTRAINT_TYPE}`);
    });

    // Check if there are any existing bookings
    const [bookings] = await connection.execute('SELECT COUNT(*) as count FROM booking');
    console.log(`\n📈 Total bookings in database: ${bookings[0].count}`);

    if (bookings[0].count > 0) {
      const [sampleBooking] = await connection.execute('SELECT * FROM booking LIMIT 1');
      console.log('\n📝 Sample booking data:');
      console.log(JSON.stringify(sampleBooking[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the check
checkDatabase();
