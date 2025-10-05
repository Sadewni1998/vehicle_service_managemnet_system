const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixBookingTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vehicle_service_db'
  });
  
  console.log('Fixing booking table structure...');
  
  // First, let's see the current table structure
  const [columns] = await connection.execute('DESCRIBE booking');
  console.log('Current booking table structure:');
  columns.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
  
  // Update the status column to use lowercase values
  await connection.execute(`
    ALTER TABLE booking 
    MODIFY COLUMN status ENUM('pending', 'arrived', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending'
  `);
  
  console.log('✅ Booking table structure updated');
  
  // Clear and recreate test data with correct status values
  const today = new Date().toISOString().split('T')[0];
  
  await connection.execute(`DELETE FROM booking WHERE DATE(bookingDate) = ?`, [today]);
  
  await connection.execute(`
    INSERT INTO booking (name, phone, vehicleNumber, vehicleType, fuelType, vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType, kilometersRun, bookingDate, timeSlot, serviceTypes, specialRequests, status) VALUES 
    ('John Smith', '1234567890', 'ABC-123', 'Sedan', 'Petrol', 'Toyota', 'Camry', 2020, 'Automatic', 50000, ?, '07:30 AM - 09:00 AM', '["Oil Change", "Brake Service"]', 'Please check air filter', 'pending'),
    ('Sarah Johnson', '0987654321', 'XYZ-789', 'SUV', 'Diesel', 'Honda', 'CR-V', 2019, 'Manual', 75000, ?, '09:00 AM - 10:30 AM', '["Engine Tune-up"]', 'Engine making strange noise', 'pending'),
    ('Mike Davis', '1122334455', 'DEF-456', 'Hatchback', 'Petrol', 'Ford', 'Focus', 2021, 'Automatic', 30000, ?, '10:30 AM - 12:00 PM', '["Tire Rotation", "Oil Change"]', 'None', 'arrived'),
    ('Emily Wilson', '5566778899', 'GHI-321', 'Sedan', 'Petrol', 'Nissan', 'Altima', 2018, 'CVT', 90000, ?, '12:30 PM - 02:00 PM', '["Brake Service"]', 'Brakes squeaking', 'pending'),
    ('Robert Brown', '9988776655', 'JKL-654', 'SUV', 'Diesel', 'Hyundai', 'Tucson', 2020, 'Automatic', 60000, ?, '02:00 PM - 03:30 PM', '["Engine Tune-up", "Oil Change"]', 'None', 'cancelled')
  `, [today, today, today, today, today]);
  
  console.log('✅ Test data recreated with correct status values');
  
  // Verify the data
  const [bookings] = await connection.execute('SELECT * FROM booking WHERE DATE(bookingDate) = ?', [today]);
  console.log(`\nFound ${bookings.length} bookings for today:`);
  bookings.forEach(b => console.log(`- ${b.vehicleNumber} (${b.name}) - Status: '${b.status}'`));
  
  await connection.end();
}

fixBookingTable().catch(console.error);
