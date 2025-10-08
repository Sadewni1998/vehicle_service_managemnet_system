const mysql = require("mysql2/promise");
require("dotenv").config();

async function directQuery() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("✓ Connected to database\n");

    // Test the exact query the API uses
    const today = "2025-10-08";
    console.log(
      `🔍 Testing query: SELECT * FROM booking WHERE DATE(bookingDate) = '${today}'`
    );

    const [bookings] = await connection.execute(
      "SELECT * FROM booking WHERE DATE(bookingDate) = ? ORDER BY timeSlot ASC",
      [today]
    );

    console.log(`\n📊 Query returned ${bookings.length} booking(s)\n`);

    if (bookings.length > 0) {
      bookings.forEach((booking) => {
        console.log(
          `Found: ${booking.vehicleNumber} - ${booking.name} - ${booking.status}`
        );

        // Transform like the API does
        const transformed = {
          id: booking.bookingId,
          timeSlot: booking.timeSlot,
          vehicleNumber: booking.vehicleNumber,
          customer: booking.name,
          status: booking.status.toLowerCase(),
          arrivedTime: booking.arrivedTime
            ? booking.arrivedTime.substring(0, 5)
            : null,
          phone: booking.phone,
          vehicleType: booking.vehicleType,
          serviceTypes: booking.serviceTypes
            ? JSON.parse(booking.serviceTypes)
            : [],
          specialRequests: booking.specialRequests,
        };

        console.log(
          "\nTransformed for API:",
          JSON.stringify(transformed, null, 2)
        );
      });

      console.log("\n✅ The query works correctly!");
      console.log(
        "⚠️  If API returns empty, the backend server needs to be restarted."
      );
      console.log("\nRestart backend with:");
      console.log(
        "   1. Stop current server (Ctrl+C in the terminal running it)"
      );
      console.log("   2. Run: npm run dev");
    } else {
      console.log("❌ No bookings found for 2025-10-08");
      console.log("The database query is returning empty.");
    }

    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

directQuery();
