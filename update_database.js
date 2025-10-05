// Script to update the database with timeSlot column
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabase() {
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

    // Check if timeSlot column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'booking' AND COLUMN_NAME = 'timeSlot'
    `, [process.env.DB_NAME || 'vehicle_service_db']);

    if (columns.length > 0) {
      console.log('✅ timeSlot column already exists in booking table');
      return;
    }

    console.log('📝 Adding timeSlot column to booking table...');
    
    // Add timeSlot column with default value
    await connection.execute(`
      ALTER TABLE booking 
      ADD COLUMN timeSlot VARCHAR(100) NOT NULL DEFAULT '09:00 AM - 10:30 AM'
    `);
    
    console.log('✅ timeSlot column added successfully!');

    // Check if unique constraint already exists
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'booking' AND CONSTRAINT_NAME = 'unique_time_slot'
    `, [process.env.DB_NAME || 'vehicle_service_db']);

    if (constraints.length === 0) {
      console.log('📝 Adding unique constraint for time slot per date...');
      
      // Add unique constraint
      await connection.execute(`
        ALTER TABLE booking 
        ADD CONSTRAINT unique_time_slot UNIQUE (bookingDate, timeSlot)
      `);
      
      console.log('✅ Unique constraint added successfully!');
    } else {
      console.log('✅ Unique constraint already exists');
    }

    console.log('🎉 Database update completed successfully!');
    console.log('📋 The booking table now includes:');
    console.log('   - timeSlot column (VARCHAR(100) NOT NULL)');
    console.log('   - Unique constraint on (bookingDate, timeSlot)');

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  Unique constraint already exists, skipping...');
    } else if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  timeSlot column already exists, skipping...');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the update
updateDatabase();
