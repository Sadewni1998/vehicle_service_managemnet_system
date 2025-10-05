const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBookings() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vehicle_service_db'
  });
  
  const [bookings] = await connection.execute('SELECT * FROM booking WHERE DATE(bookingDate) = CURDATE()');
  console.log('Today\'s bookings:');
  bookings.forEach(b => console.log(`- ${b.vehicleNumber} (${b.name}) - Status: '${b.status}'`));
  
  await connection.end();
}

checkBookings().catch(console.error);
