const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixBookingStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vehicle_service_db'
  });
  
  // Update booking status values to match frontend expectations
  console.log('Updating booking status values...');
  
  await connection.execute(`
    UPDATE booking 
    SET status = CASE 
      WHEN status = 'Pending' THEN 'pending'
      WHEN status = 'Confirmed' THEN 'confirmed'
      WHEN status = 'In Progress' THEN 'in_progress'
      WHEN status = 'Completed' THEN 'completed'
      WHEN status = 'Cancelled' THEN 'cancelled'
      ELSE status
    END
  `);
  
  // Also add some test bookings with proper status
  const today = new Date().toISOString().split('T')[0];
  
  await connection.execute(`
    DELETE FROM booking WHERE DATE(bookingDate) = ?
  `, [today]);
  
  await connection.execute(`
    INSERT INTO booking (name, phone, vehicleNumber, vehicleType, fuelType, vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType, kilometersRun, bookingDate, timeSlot, serviceTypes, specialRequests, status) VALUES 
    ('John Smith', '1234567890', 'ABC-123', 'Sedan', 'Petrol', 'Toyota', 'Camry', 2020, 'Automatic', 50000, ?, '07:30 AM - 09:00 AM', '["Oil Change", "Brake Service"]', 'Please check air filter', 'pending'),
    ('Sarah Johnson', '0987654321', 'XYZ-789', 'SUV', 'Diesel', 'Honda', 'CR-V', 2019, 'Manual', 75000, ?, '09:00 AM - 10:30 AM', '["Engine Tune-up"]', 'Engine making strange noise', 'pending'),
    ('Mike Davis', '1122334455', 'DEF-456', 'Hatchback', 'Petrol', 'Ford', 'Focus', 2021, 'Automatic', 30000, ?, '10:30 AM - 12:00 PM', '["Tire Rotation", "Oil Change"]', 'None', 'arrived'),
    ('Emily Wilson', '5566778899', 'GHI-321', 'Sedan', 'Petrol', 'Nissan', 'Altima', 2018, 'CVT', 90000, ?, '12:30 PM - 02:00 PM', '["Brake Service"]', 'Brakes squeaking', 'pending'),
    ('Robert Brown', '9988776655', 'JKL-654', 'SUV', 'Diesel', 'Hyundai', 'Tucson', 2020, 'Automatic', 60000, ?, '02:00 PM - 03:30 PM', '["Engine Tune-up", "Oil Change"]', 'None', 'cancelled')
  `, [today, today, today, today, today]);
  
  console.log('✅ Booking status values updated and test data refreshed');
  
  // Verify the data
  const [bookings] = await connection.execute('SELECT * FROM booking WHERE DATE(bookingDate) = ?', [today]);
  console.log(`\nFound ${bookings.length} bookings for today:`);
  bookings.forEach(b => console.log(`- ${b.vehicleNumber} (${b.name}) - Status: '${b.status}'`));
  
  await connection.end();
}

fixBookingStatus().catch(console.error);
