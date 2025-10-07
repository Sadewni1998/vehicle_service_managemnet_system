const mysql = require('mysql2/promise');
require('dotenv').config();

async function addArrivedTimeColumn() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vehicle_service_db'
    });

    console.log('Connected to database successfully');

    // Add arrivedTime column if it doesn't exist
    const alterQuery = `
      ALTER TABLE booking 
      ADD COLUMN arrivedTime TIME NULL,
      MODIFY COLUMN status ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'arrived') DEFAULT 'Pending'
    `;

    try {
      await connection.execute(alterQuery);
      console.log('Successfully added arrivedTime column and updated status enum');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('arrivedTime column already exists');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Error adding arrivedTime column:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

addArrivedTimeColumn();
