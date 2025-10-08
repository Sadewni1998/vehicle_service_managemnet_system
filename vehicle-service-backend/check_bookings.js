const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkBookings() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("✓ Connected to database successfully\n");

    // Check bookings for October 8, 2025
    const targetDate = "2025-10-08";
    console.log(`📅 Checking bookings for: ${targetDate}`);
    console.log("═".repeat(100));

    const [bookings] = await connection.execute(
      `SELECT bookingId, name, phone, vehicleNumber, vehicleType, 
              bookingDate, timeSlot, status, arrivedTime, 
              serviceTypes, specialRequests
       FROM booking 
       WHERE bookingDate = ? 
       ORDER BY timeSlot ASC`,
      [targetDate]
    );

    if (bookings.length === 0) {
      console.log(`\n❌ No bookings found for ${targetDate}`);
      console.log("\nTo add test bookings, run: node add_today_bookings.js\n");
    } else {
      console.log(
        `\n✅ Found ${bookings.length} booking(s) for ${targetDate}:\n`
      );

      bookings.forEach((booking, index) => {
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
          `${index + 1}. ${statusEmoji} Booking ID: ${booking.bookingId}`
        );
        console.log(`   ├─ Customer: ${booking.name} (${booking.phone})`);
        console.log(
          `   ├─ Vehicle: ${booking.vehicleNumber} (${booking.vehicleType})`
        );
        console.log(`   ├─ Time Slot: ${booking.timeSlot}`);
        console.log(`   ├─ Status: ${booking.status.toUpperCase()}`);
        if (booking.arrivedTime) {
          console.log(`   ├─ Arrived Time: ${booking.arrivedTime}`);
        }
        if (booking.serviceTypes) {
          const services = JSON.parse(booking.serviceTypes);
          console.log(`   ├─ Services: ${services.join(", ")}`);
        }
        if (booking.specialRequests) {
          console.log(`   └─ Special Requests: ${booking.specialRequests}`);
        } else {
          console.log(`   └─ Special Requests: None`);
        }
        console.log("");
      });

      // Summary by status
      const statusCounts = {
        pending: bookings.filter((b) => b.status === "pending").length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        arrived: bookings.filter((b) => b.status === "arrived").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
        in_progress: bookings.filter((b) => b.status === "in_progress").length,
        completed: bookings.filter((b) => b.status === "completed").length,
      };

      console.log("═".repeat(100));
      console.log("📊 Summary by Status:");
      console.log(`   ⏳ Pending: ${statusCounts.pending}`);
      console.log(`   ✅ Confirmed: ${statusCounts.confirmed}`);
      console.log(`   🚗 Arrived: ${statusCounts.arrived}`);
      console.log(`   🔧 In Progress: ${statusCounts.in_progress}`);
      console.log(`   ✔️  Completed: ${statusCounts.completed}`);
      console.log(`   ❌ Cancelled: ${statusCounts.cancelled}`);
      console.log(`   ────────────────`);
      console.log(`   📋 Total: ${bookings.length}`);
      console.log("═".repeat(100));
    }

    // Also check all dates with bookings
    const [allDates] = await connection.execute(
      `SELECT DISTINCT bookingDate, COUNT(*) as count 
       FROM booking 
       GROUP BY bookingDate 
       ORDER BY bookingDate DESC 
       LIMIT 10`
    );

    if (allDates.length > 0) {
      console.log("\n📅 Recent booking dates in database:");
      allDates.forEach((row) => {
        const isTarget =
          row.bookingDate.toISOString().split("T")[0] === targetDate;
        const marker = isTarget ? "👉" : "  ";
        console.log(
          `${marker} ${row.bookingDate.toISOString().split("T")[0]}: ${
            row.count
          } booking(s)`
        );
      });
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
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
      console.log("\n✓ Database connection closed\n");
    }
  }
}

checkBookings();
