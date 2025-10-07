const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestData() {
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

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('Inserting test data for date:', today);

    // Insert test bookings
    const insertQuery = `
      INSERT INTO booking (
        name, phone, vehicleNumber, vehicleType, fuelType,
        vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType,
        kilometersRun, bookingDate, timeSlot, serviceTypes,
        specialRequests, customerId, status, arrivedTime
      ) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const testBookings = [
      [
        'John Smith', '0771234567', 'ABC-123', 'Sedan', 'Petrol',
        'Toyota', 'Camry', 2020, 'Automatic',
        45000, today, '07:30-09:30', '["Oil Change", "Brake Inspection"]',
        'Please check the air conditioning system', null, 'pending', null
      ],
      [
        'Sarah Johnson', '0777654321', 'XYZ-789', 'SUV', 'Petrol',
        'Honda', 'CR-V', 2019, 'Automatic',
        52000, today, '09:30-11:30', '["Engine Service", "Tire Rotation"]',
        'Check for any unusual noises', null, 'pending', null
      ],
      [
        'Michael Chen', '0775555555', 'DEF-456', 'Hatchback', 'Petrol',
        'Nissan', 'Micra', 2021, 'Manual',
        28000, today, '12:00-14:00', '["Regular Service", "Battery Check"]',
        'Replace air filter', null, 'arrived', '07:45'
      ],
      [
        'Emily Davis', '0778888888', 'GHI-321', 'Sedan', 'Petrol',
        'BMW', '3 Series', 2018, 'Automatic',
        65000, today, '14:00-16:00', '["Premium Service", "Transmission Check"]',
        'Full diagnostic check', null, 'pending', null
      ],
      [
        'Robert Wilson', '0779999999', 'JKL-654', 'Pickup', 'Diesel',
        'Ford', 'Ranger', 2017, 'Manual',
        78000, today, '16:00-18:00', '["Engine Overhaul", "Clutch Replacement"]',
        'Customer cancelled due to emergency', null, 'cancelled', null
      ]
    ];

    // Clear existing bookings for today first
    await connection.execute('DELETE FROM booking WHERE bookingDate = ?', [today]);
    console.log('Cleared existing bookings for today');

    // Insert new test bookings
    for (const booking of testBookings) {
      await connection.execute(insertQuery, booking);
    }

    console.log('Successfully inserted', testBookings.length, 'test bookings for today');

    // Verify the data
    const [rows] = await connection.execute('SELECT * FROM booking WHERE bookingDate = ?', [today]);
    console.log('Current bookings for today:', rows.length);
    rows.forEach(booking => {
      console.log(`- ${booking.vehicleNumber} (${booking.name}): ${booking.status}`);
    });

  } catch (error) {
    console.error('Error inserting test data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

insertTestData();
