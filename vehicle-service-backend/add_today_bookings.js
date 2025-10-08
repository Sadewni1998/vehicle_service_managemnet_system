const mysql = require("mysql2/promise");
require("dotenv").config();

async function addTodayBookings() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("✓ Connected to database successfully");

    // Get today's date
    const today = new Date().toISOString().split("T")[0];
    console.log(`✓ Adding test bookings for: ${today}`);

    // Insert test bookings for today
    const insertQuery = `
      INSERT INTO booking (
        name, phone, vehicleNumber, vehicleType, fuelType,
        vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType,
        bookingDate, timeSlot, serviceTypes,
        specialRequests, customerId, status, arrivedTime
      ) VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const testBookings = [
      [
        "John Smith",
        "0771234567",
        "ABC-1234",
        "Sedan",
        "Petrol",
        "Toyota",
        "Camry",
        2020,
        "Automatic",
        today,
        "07:30 AM - 09:00 AM",
        '["Oil Change", "Brake Inspection"]',
        "Please check the air conditioning system",
        null,
        "pending",
        null,
      ],
      [
        "Sarah Johnson",
        "0777654321",
        "XYZ-9876",
        "SUV",
        "Diesel",
        "Honda",
        "CR-V",
        2019,
        "Automatic",
        today,
        "09:00 AM - 10:30 AM",
        '["Engine Service", "Tire Rotation"]',
        "Check for any unusual noises",
        null,
        "pending",
        null,
      ],
      [
        "Michael Chen",
        "0775555555",
        "DEF-5555",
        "Hatchback",
        "Petrol",
        "Nissan",
        "Micra",
        2021,
        "Manual",
        today,
        "10:30 AM - 12:00 PM",
        '["Regular Service", "Battery Check"]',
        "Replace air filter if needed",
        null,
        "confirmed",
        null,
      ],
      [
        "Emily Davis",
        "0778888888",
        "GHI-3212",
        "Sedan",
        "Petrol",
        "BMW",
        "3 Series",
        2018,
        "Automatic",
        today,
        "12:30 PM - 02:00 PM",
        '["Premium Service", "Transmission Check"]',
        "Full diagnostic check requested",
        null,
        "arrived",
        "12:35",
      ],
      [
        "Robert Wilson",
        "0779999999",
        "JKL-6543",
        "Pickup",
        "Diesel",
        "Ford",
        "Ranger",
        2017,
        "Manual",
        today,
        "02:00 PM - 03:30 PM",
        '["Clutch Service", "Brake Pads"]',
        "Customer reports clutch slipping",
        null,
        "confirmed",
        null,
      ],
      [
        "Lisa Anderson",
        "0776666666",
        "MNO-7890",
        "Van",
        "Diesel",
        "Toyota",
        "Hiace",
        2016,
        "Manual",
        today,
        "03:30 PM - 05:00 PM",
        '["Engine Check", "AC Service"]',
        "Air conditioning not cooling properly",
        null,
        "pending",
        null,
      ],
    ];

    // Clear existing bookings for today first (optional)
    const [deleteResult] = await connection.execute(
      "DELETE FROM booking WHERE bookingDate = ?",
      [today]
    );
    console.log(
      `✓ Cleared ${deleteResult.affectedRows} existing bookings for today`
    );

    // Insert new test bookings
    let inserted = 0;
    for (const booking of testBookings) {
      try {
        await connection.execute(insertQuery, booking);
        inserted++;
      } catch (err) {
        // Skip if duplicate (e.g., unique constraint on time slot)
        if (err.code === "ER_DUP_ENTRY") {
          console.log(`  ⚠ Skipped duplicate: ${booking[2]} at ${booking[10]}`);
        } else {
          throw err;
        }
      }
    }

    console.log(
      `✓ Successfully inserted ${inserted}/${testBookings.length} test bookings`
    );

    // Verify the data
    const [rows] = await connection.execute(
      "SELECT bookingId, vehicleNumber, name, timeSlot, status, arrivedTime FROM booking WHERE bookingDate = ? ORDER BY timeSlot",
      [today]
    );

    console.log(`\n📋 Current bookings for today (${rows.length} total):`);
    console.log("─".repeat(80));
    rows.forEach((booking) => {
      const statusEmoji =
        {
          pending: "⏳",
          confirmed: "✅",
          arrived: "🚗",
          cancelled: "❌",
          in_progress: "🔧",
          completed: "✔️",
        }[booking.status] || "📝";

      console.log(
        `${statusEmoji} ${booking.vehicleNumber.padEnd(
          12
        )} | ${booking.name.padEnd(18)} | ${booking.timeSlot.padEnd(20)} | ${
          booking.status
        }`
      );
    });
    console.log("─".repeat(80));

    console.log(
      "\n✅ All done! You can now view these bookings in the Receptionist Dashboard."
    );
  } catch (error) {
    console.error("❌ Error adding test bookings:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("   → Make sure your MySQL server is running");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("   → Check your database credentials in .env file");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("   → Database does not exist. Run db_setup.sql first");
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log("✓ Database connection closed");
    }
  }
}

addTodayBookings();
