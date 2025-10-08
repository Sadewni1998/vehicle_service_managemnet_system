const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "vehicle_service_db",
};

async function createJobcardsForExistingArrivedBookings() {
  let connection;

  try {
    console.log("🔌 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);

    console.log("\n📋 Creating Jobcards for Existing Arrived Bookings\n");
    console.log("=".repeat(60));

    // Step 1: Find arrived bookings without jobcards
    console.log("\n🔍 Step 1: Finding arrived bookings without jobcards...");
    const [arrivedWithoutJobcards] = await connection.query(`
            SELECT b.bookingId, b.vehicleNumber, b.serviceTypes, b.arrivedTime
            FROM booking b
            LEFT JOIN jobcard j ON b.bookingId = j.bookingId
            WHERE b.status = 'arrived' 
            AND j.jobcardId IS NULL
            ORDER BY b.bookingId
        `);

    if (arrivedWithoutJobcards.length === 0) {
      console.log("✅ All arrived bookings already have jobcards!");
      return;
    }

    console.log(
      `Found ${arrivedWithoutJobcards.length} arrived booking(s) without jobcards:`
    );
    console.table(arrivedWithoutJobcards);

    // Step 2: Get a mechanic to use as placeholder
    console.log("\n🔧 Step 2: Finding a mechanic for placeholder...");
    const [mechanics] = await connection.query(
      "SELECT mechanicId, mechanicName FROM mechanic WHERE isActive = true ORDER BY mechanicId LIMIT 1"
    );

    if (mechanics.length === 0) {
      console.log("❌ No active mechanics found! Cannot create jobcards.");
      console.log("   Please add at least one active mechanic first.");
      return;
    }

    const placeholderMechanicId = mechanics[0].mechanicId;
    console.log(
      `✅ Using mechanic ID ${placeholderMechanicId} (${mechanics[0].mechanicName}) as placeholder`
    );

    // Step 3: Create jobcards
    console.log("\n➕ Step 3: Creating jobcards...");
    let created = 0;
    let errors = 0;

    for (const booking of arrivedWithoutJobcards) {
      try {
        const serviceTypes = booking.serviceTypes || "[]";

        await connection.query(
          `INSERT INTO jobcard (mechanicId, bookingId, partCode, status, serviceDetails) 
                     VALUES (?, ?, ?, 'open', ?)`,
          [
            placeholderMechanicId,
            booking.bookingId,
            "PENDING_ASSIGNMENT",
            serviceTypes,
          ]
        );

        console.log(
          `  ✅ Created jobcard for booking ${booking.bookingId} (${booking.vehicleNumber})`
        );
        created++;
      } catch (error) {
        console.log(
          `  ❌ Failed to create jobcard for booking ${booking.bookingId}: ${error.message}`
        );
        errors++;
      }
    }

    // Step 4: Verify
    console.log("\n✨ Summary:");
    console.log(`   ✅ Successfully created: ${created} jobcard(s)`);
    if (errors > 0) {
      console.log(`   ❌ Errors: ${errors}`);
    }

    // Step 5: Show created jobcards
    if (created > 0) {
      console.log("\n📊 Created Jobcards:");
      const [newJobcards] = await connection.query(`
                SELECT 
                    j.jobcardId,
                    j.bookingId,
                    j.mechanicId,
                    j.partCode,
                    j.status,
                    b.vehicleNumber,
                    b.arrivedTime
                FROM jobcard j
                JOIN booking b ON j.bookingId = b.bookingId
                WHERE j.partCode = 'PENDING_ASSIGNMENT'
                ORDER BY j.jobcardId DESC
                LIMIT 10
            `);
      console.table(newJobcards);
    }

    console.log(
      "\n🎉 Done! Jobcards have been created for existing arrived bookings."
    );
    console.log(
      "💡 Service Advisors can now assign actual mechanics to these jobcards."
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

createJobcardsForExistingArrivedBookings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
