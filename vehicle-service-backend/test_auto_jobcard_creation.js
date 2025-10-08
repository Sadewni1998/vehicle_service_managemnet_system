const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "vehicle_service_db",
};

async function testAutoJobcardCreation() {
  let connection;

  try {
    console.log("🔌 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);

    console.log("\n📋 Testing Auto-Jobcard Creation for Arrived Bookings\n");
    console.log("=".repeat(60));

    // Step 1: Check current arrived bookings
    console.log("\n📊 Step 1: Checking arrived bookings...");
    const [arrivedBookings] = await connection.query(`
            SELECT bookingId, vehicleNumber, status, arrivedTime, serviceTypes
            FROM booking 
            WHERE status = 'arrived'
            ORDER BY bookingId DESC
            LIMIT 5
        `);

    if (arrivedBookings.length === 0) {
      console.log("⚠️  No arrived bookings found.");
      console.log("   Creating a test booking...");

      // Create a test booking
      const [insertResult] = await connection.query(`
                INSERT INTO booking (
                    name, phone, vehicleNumber, vehicleType, 
                    fuelType, vehicleBrand, vehicleBrandModel, 
                    manufacturedYear, transmissionType, 
                    bookingDate, timeSlot, serviceTypes, status
                ) VALUES (
                    'Test Customer', '0771234567', 'TEST-999', 'Sedan',
                    'Petrol', 'Toyota', 'Corolla', 2020, 'Automatic',
                    CURDATE(), '09:00-11:00', 
                    '["Regular Service", "Oil Change"]', 
                    'pending'
                )
            `);

      const newBookingId = insertResult.insertId;
      console.log(`✅ Test booking created with ID: ${newBookingId}`);

      // Update it to arrived
      console.log(`\n📝 Step 2: Marking test booking as 'arrived'...`);
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      await connection.query(
        "UPDATE booking SET status = 'arrived', arrivedTime = ? WHERE bookingId = ?",
        [currentTime, newBookingId]
      );

      console.log(
        `✅ Booking ${newBookingId} marked as arrived at ${currentTime}`
      );

      // Check if jobcard was created
      console.log(`\n🔍 Step 3: Checking if jobcard was auto-created...`);
      const [jobcards] = await connection.query(
        `
                SELECT * FROM jobcard WHERE bookingId = ?
            `,
        [newBookingId]
      );

      if (jobcards.length > 0) {
        console.log("✅ SUCCESS! Jobcard was automatically created:");
        console.table(jobcards);
      } else {
        console.log("❌ FAIL: No jobcard was created automatically");
        console.log("   Note: This test simulates direct DB update.");
        console.log(
          "   The auto-creation happens in updateBookingStatus() API endpoint."
        );
      }
    } else {
      console.log(`Found ${arrivedBookings.length} arrived booking(s):`);
      console.table(arrivedBookings);

      // Check their jobcards
      console.log("\n🔍 Step 2: Checking jobcards for arrived bookings...");
      const bookingIds = arrivedBookings.map((b) => b.bookingId);
      const placeholders = bookingIds.map(() => "?").join(",");

      const [jobcards] = await connection.query(
        `
                SELECT 
                    j.jobcardId,
                    j.bookingId,
                    j.mechanicId,
                    j.partCode,
                    j.status,
                    j.assignedAt,
                    b.vehicleNumber,
                    b.arrivedTime
                FROM jobcard j
                INNER JOIN booking b ON j.bookingId = b.bookingId
                WHERE j.bookingId IN (${placeholders})
                ORDER BY j.assignedAt DESC
            `,
        bookingIds
      );

      if (jobcards.length > 0) {
        console.log(
          `✅ Found ${jobcards.length} jobcard(s) for arrived bookings:`
        );
        console.table(jobcards);
      } else {
        console.log("⚠️  No jobcards found for arrived bookings");
        console.log("   This might mean:");
        console.log(
          "   1. Bookings were marked as arrived before auto-creation was implemented"
        );
        console.log("   2. Jobcard creation failed (check server logs)");
      }
    }

    // Show summary of pending assignment jobcards
    console.log(
      "\n📊 Summary: Auto-created Jobcards (with PENDING_ASSIGNMENT)"
    );
    const [pendingJobcards] = await connection.query(`
            SELECT 
                j.jobcardId,
                j.bookingId,
                j.partCode,
                j.status,
                j.assignedAt,
                b.vehicleNumber,
                b.status as bookingStatus
            FROM jobcard j
            JOIN booking b ON j.bookingId = b.bookingId
            WHERE j.partCode = 'PENDING_ASSIGNMENT'
            ORDER BY j.assignedAt DESC
            LIMIT 10
        `);

    if (pendingJobcards.length > 0) {
      console.log(`\nFound ${pendingJobcards.length} auto-created jobcard(s):`);
      console.table(pendingJobcards);
    } else {
      console.log(
        '\n⚠️  No auto-created jobcards found (partCode = "PENDING_ASSIGNMENT")'
      );
    }

    // Show statistics
    console.log("\n📈 Statistics:");
    const [stats] = await connection.query(`
            SELECT 
                COUNT(DISTINCT b.bookingId) as total_arrived_bookings,
                COUNT(DISTINCT j.jobcardId) as total_jobcards,
                COUNT(DISTINCT CASE WHEN j.partCode = 'PENDING_ASSIGNMENT' THEN j.jobcardId END) as auto_created_jobcards
            FROM booking b
            LEFT JOIN jobcard j ON b.bookingId = j.bookingId
            WHERE b.status = 'arrived'
        `);

    console.table(stats);

    console.log("\n✨ Test completed!");
    console.log("\n💡 Tips:");
    console.log(
      "   - To test the actual API: Use Postman or the Receptionist Dashboard"
    );
    console.log(
      '   - To see auto-creation in action: Mark a booking as "arrived" via API'
    );
    console.log(
      '   - Check server console for log: "✅ Jobcard automatically created for booking X"'
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAutoJobcardCreation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
