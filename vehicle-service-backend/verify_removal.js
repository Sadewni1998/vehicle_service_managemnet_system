const mysql = require("mysql2/promise");
require("dotenv").config();

async function verifyRemoval() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("🔍 Verifying kilometersRun column removal...\n");

    // Check if column still exists
    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'booking' AND COLUMN_NAME = 'kilometersRun'
    `,
      [process.env.DB_NAME || "vehicle_service_db"]
    );

    if (columns.length === 0) {
      console.log(
        "✅ SUCCESS: kilometersRun column has been successfully removed"
      );
    } else {
      console.log("❌ FAILED: kilometersRun column still exists");
    }

    // Check current bookings
    const [bookings] = await connection.query(
      "SELECT COUNT(*) as count FROM booking"
    );
    console.log(`📊 Current bookings in database: ${bookings[0].count}`);

    // Test a new booking insertion (without kilometersRun)
    const testBooking = [
      "Test User",
      "0770000000",
      "TEST-123",
      "Sedan",
      "Petrol",
      "Test Brand",
      "Test Model",
      2023,
      "Automatic",
      new Date().toISOString().split("T")[0],
      "07:30-09:30",
      '["Test Service"]',
      "Test booking without kilometersRun",
      null,
      "pending",
    ];

    const insertQuery = `
      INSERT INTO booking (
        name, phone, vehicleNumber, vehicleType, fuelType,
        vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType,
        bookingDate, timeSlot, serviceTypes,
        specialRequests, customerId, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.query(insertQuery, testBooking);
    console.log(
      "✅ Test booking inserted successfully without kilometersRun field"
    );

    // Clean up test booking
    await connection.query("DELETE FROM booking WHERE vehicleNumber = ?", [
      "TEST-123",
    ]);
    console.log("🧹 Test booking cleaned up");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

verifyRemoval();
