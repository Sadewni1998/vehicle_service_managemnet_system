// Script to set up test data for receptionist dashboard
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupTestData() {
  console.log('Setting up test data for receptionist dashboard...\n');

  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vehicle_service_db'
    });

    console.log('✅ Connected to database');

    // Create staff table
    console.log('1. Creating staff table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        staffId INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('receptionist', 'mechanic', 'manager', 'service_advisor') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Staff table created');

    // Hash password for test users (password: 'receptionist123')
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('receptionist123', 10);

    // Insert test staff members
    console.log('2. Creating test staff members...');
    await connection.execute(`
      INSERT IGNORE INTO staff (name, email, password, role) VALUES 
      ('Test Receptionist', 'receptionist@test.com', ?, 'receptionist'),
      ('John Manager', 'manager@test.com', ?, 'manager'),
      ('Sarah Mechanic', 'mechanic@test.com', ?, 'mechanic')
    `, [hashedPassword, hashedPassword, hashedPassword]);
    console.log('✅ Test staff members created');

    // Insert test bookings for today
    console.log('3. Creating test bookings for today...');
    const today = new Date().toISOString().split('T')[0];
    
    await connection.execute(`
      INSERT IGNORE INTO booking (name, phone, vehicleNumber, vehicleType, fuelType, vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType, kilometersRun, bookingDate, timeSlot, serviceTypes, specialRequests, status) VALUES 
      ('John Smith', '1234567890', 'ABC-123', 'Sedan', 'Petrol', 'Toyota', 'Camry', 2020, 'Automatic', 50000, ?, '07:30 AM - 09:00 AM', '["Oil Change", "Brake Service"]', 'Please check air filter', 'pending'),
      ('Sarah Johnson', '0987654321', 'XYZ-789', 'SUV', 'Diesel', 'Honda', 'CR-V', 2019, 'Manual', 75000, ?, '09:00 AM - 10:30 AM', '["Engine Tune-up"]', 'Engine making strange noise', 'pending'),
      ('Mike Davis', '1122334455', 'DEF-456', 'Hatchback', 'Petrol', 'Ford', 'Focus', 2021, 'Automatic', 30000, ?, '10:30 AM - 12:00 PM', '["Tire Rotation", "Oil Change"]', 'None', 'arrived'),
      ('Emily Wilson', '5566778899', 'GHI-321', 'Sedan', 'Petrol', 'Nissan', 'Altima', 2018, 'CVT', 90000, ?, '12:30 PM - 02:00 PM', '["Brake Service"]', 'Brakes squeaking', 'pending'),
      ('Robert Brown', '9988776655', 'JKL-654', 'SUV', 'Diesel', 'Hyundai', 'Tucson', 2020, 'Automatic', 60000, ?, '02:00 PM - 03:30 PM', '["Engine Tune-up", "Oil Change"]', 'None', 'cancelled')
    `, [today, today, today, today, today]);
    console.log('✅ Test bookings created');

    // Verify the data
    console.log('\n4. Verifying test data...');
    const [staff] = await connection.execute('SELECT * FROM staff');
    const [bookings] = await connection.execute('SELECT * FROM booking WHERE DATE(bookingDate) = ?', [today]);
    
    console.log(`✅ Found ${staff.length} staff members:`);
    staff.forEach(s => console.log(`   - ${s.name} (${s.email}) - ${s.role}`));
    
    console.log(`✅ Found ${bookings.length} bookings for today:`);
    bookings.forEach(b => console.log(`   - ${b.vehicleNumber} (${b.name}) - ${b.status}`));

    console.log('\n🎉 Test data setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('Email: receptionist@test.com');
    console.log('Password: receptionist123');
    console.log('Role: receptionist');

  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Database connection failed. Please check your database credentials in the .env file.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Please create the database first.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupTestData();
