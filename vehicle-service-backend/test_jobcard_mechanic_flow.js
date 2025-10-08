/**
 * Test Script: Verify Jobcard Visibility in Mechanic Dashboard
 *
 * Purpose: Test the complete flow from job submission to mechanic dashboard display
 *
 * Run: node test_jobcard_mechanic_flow.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function testJobcardMechanicFlow() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("✅ Connected to database successfully\n");

    // Step 1: Check for bookings with in_progress status
    console.log("📊 Step 1: Checking bookings with in_progress status...");
    const [inProgressBookings] = await connection.query(`
      SELECT 
        bookingId,
        vehicleNumber,
        name as customerName,
        status,
        assignedMechanics,
        assignedSpareParts
      FROM booking
      WHERE status = 'in_progress'
      ORDER BY bookingId DESC
      LIMIT 5
    `);

    console.log(
      `Found ${inProgressBookings.length} booking(s) with 'in_progress' status:`
    );
    inProgressBookings.forEach((booking) => {
      console.log(
        `  - Booking #${booking.bookingId}: ${booking.vehicleNumber} (${booking.customerName})`
      );
      console.log(
        `    Assigned Mechanics: ${booking.assignedMechanics || "None"}`
      );
      console.log(
        `    Assigned Spare Parts: ${booking.assignedSpareParts || "None"}`
      );
    });
    console.log();

    // Step 2: Check jobcards linked to these bookings
    console.log("📋 Step 2: Checking jobcards for in_progress bookings...");
    const [jobcards] = await connection.query(`
      SELECT 
        j.jobcardId,
        j.bookingId,
        j.mechanicId,
        j.status as jobcardStatus,
        j.partCode,
        j.assignedAt,
        b.vehicleNumber,
        b.status as bookingStatus
      FROM jobcard j
      JOIN booking b ON j.bookingId = b.bookingId
      WHERE b.status = 'in_progress'
      ORDER BY j.jobcardId DESC
    `);

    console.log(
      `Found ${jobcards.length} jobcard(s) for in_progress bookings:`
    );
    jobcards.forEach((jc) => {
      console.log(
        `  - Jobcard #${jc.jobcardId}: Booking #${jc.bookingId} (${jc.vehicleNumber})`
      );
      console.log(
        `    Status: ${jc.jobcardStatus}, Mechanic: ${jc.mechanicId}, Part Code: ${jc.partCode}`
      );
      console.log(`    Assigned At: ${jc.assignedAt}`);
    });
    console.log();

    // Step 3: Check mechanics assigned to these jobcards
    console.log("👥 Step 3: Checking mechanics assigned to jobcards...");
    for (const jobcard of jobcards) {
      const [mechanics] = await connection.query(
        `
        SELECT 
          jm.mechanicId,
          m.mechanicName,
          m.mechanicCode,
          jm.assignedAt
        FROM jobcardMechanic jm
        JOIN mechanic m ON jm.mechanicId = m.mechanicId
        WHERE jm.jobcardId = ?
      `,
        [jobcard.jobcardId]
      );

      console.log(
        `  Jobcard #${jobcard.jobcardId} has ${mechanics.length} mechanic(s):`
      );
      if (mechanics.length > 0) {
        mechanics.forEach((mech) => {
          console.log(`    - ${mech.mechanicName} (${mech.mechanicCode})`);
        });
      } else {
        console.log(`    - No mechanics assigned yet`);
      }
    }
    console.log();

    // Step 4: Check spare parts assigned to these jobcards
    console.log("🔧 Step 4: Checking spare parts assigned to jobcards...");
    for (const jobcard of jobcards) {
      const [spareParts] = await connection.query(
        `
        SELECT 
          jsp.partId,
          sp.partName,
          sp.partCode,
          jsp.quantity,
          jsp.totalPrice
        FROM jobcardSparePart jsp
        JOIN spareparts sp ON jsp.partId = sp.partId
        WHERE jsp.jobcardId = ?
      `,
        [jobcard.jobcardId]
      );

      console.log(
        `  Jobcard #${jobcard.jobcardId} has ${spareParts.length} spare part(s):`
      );
      if (spareParts.length > 0) {
        spareParts.forEach((part) => {
          console.log(
            `    - ${part.partName} (${part.partCode}): Qty ${part.quantity}, Rs. ${part.totalPrice}`
          );
        });
      } else {
        console.log(`    - No spare parts assigned yet`);
      }
    }
    console.log();

    // Step 5: Show API endpoint test
    console.log("🔗 Step 5: Testing API endpoint format...");
    if (jobcards.length > 0) {
      const sampleJobcard = jobcards[0];
      const [jobcardMechanics] = await connection.query(
        `
        SELECT DISTINCT mechanicId 
        FROM jobcardMechanic 
        WHERE jobcardId = ?
      `,
        [sampleJobcard.jobcardId]
      );

      if (jobcardMechanics.length > 0) {
        const mechanicId = jobcardMechanics[0].mechanicId;
        console.log(`\n📡 Example API call:`);
        console.log(`   GET /api/jobcards/mechanic/${mechanicId}`);
        console.log(
          `\n   This will return all jobcards assigned to mechanic #${mechanicId}`
        );
      } else {
        console.log(`\n⚠️ No mechanics assigned to jobcards yet.`);
        console.log(`   First assign mechanics via Service Advisor Dashboard.`);
      }
    }
    console.log();

    // Step 6: Show test instructions
    console.log("📝 Testing Instructions:");
    console.log("─────────────────────────────────────────────────────────");
    console.log("1. Login as Service Advisor");
    console.log('2. Go to "Assign Jobs" tab');
    console.log("3. For an arrived booking:");
    console.log('   a. Click "Assign Mechanics" and select mechanics');
    console.log('   b. Click "Assign Spare-parts" and select parts');
    console.log('   c. Click "Submit Job" button');
    console.log("");
    console.log("4. Login as Mechanic (use the assigned mechanic credentials)");
    console.log('5. Go to "Job Cards" tab');
    console.log("6. ✅ You should see the submitted job card!");
    console.log("");
    console.log(
      "Note: Mechanic login credentials are stored in the staff table"
    );
    console.log(
      '      Use email and password from staff table where role = "mechanic"'
    );
    console.log("─────────────────────────────────────────────────────────");
    console.log();

    // Step 7: Show available mechanics
    console.log("👤 Available Mechanics for Testing:");
    const [availableMechanics] = await connection.query(`
      SELECT 
        s.staffId,
        s.email,
        m.mechanicId,
        m.mechanicName,
        m.mechanicCode,
        m.availability
      FROM staff s
      JOIN mechanic m ON s.staffId = m.staffId
      WHERE s.role = 'mechanic' AND m.isActive = true
      ORDER BY m.mechanicId
      LIMIT 5
    `);

    console.log(`Found ${availableMechanics.length} mechanic(s):`);
    availableMechanics.forEach((mech) => {
      console.log(`  - ${mech.mechanicName} (${mech.mechanicCode})`);
      console.log(`    Email: ${mech.email}`);
      console.log(`    Mechanic ID: ${mech.mechanicId}`);
      console.log(`    Status: ${mech.availability}`);
      console.log();
    });

    console.log("✅ Test script completed successfully!");
  } catch (error) {
    console.error("❌ Error during test:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n📤 Database connection closed");
    }
  }
}

// Run the test
testJobcardMechanicFlow()
  .then(() => {
    console.log("\n🎉 All checks completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });
