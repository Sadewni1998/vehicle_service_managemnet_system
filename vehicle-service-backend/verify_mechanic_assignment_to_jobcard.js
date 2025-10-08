const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "vehicle_service_db",
};

async function verifyMechanicAssignment() {
  let connection;

  try {
    console.log("🔌 Connecting to database...\n");
    connection = await mysql.createConnection(dbConfig);

    console.log("=".repeat(70));
    console.log("  VERIFYING MECHANIC ASSIGNMENT TO JOBCARD TABLE");
    console.log("=".repeat(70));

    // Step 1: Check jobcard table structure
    console.log("\n📋 Step 1: Checking jobcard table structure...\n");
    const [jobcardColumns] = await connection.query(`
            DESCRIBE jobcard
        `);

    console.log("Jobcard table columns:");
    jobcardColumns.forEach((col) => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Step 2: Check jobcardMechanic table structure
    console.log("\n📋 Step 2: Checking jobcardMechanic table structure...\n");
    const [jobcardMechanicColumns] = await connection.query(`
            DESCRIBE jobcardMechanic
        `);

    console.log("JobcardMechanic table columns:");
    jobcardMechanicColumns.forEach((col) => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Step 3: Check existing jobcards
    console.log("\n📊 Step 3: Checking existing jobcards...\n");
    const [jobcards] = await connection.query(`
            SELECT 
                j.jobcardId,
                j.mechanicId as primaryMechanicId,
                j.bookingId,
                j.partCode,
                j.status,
                b.vehicleNumber,
                b.status as bookingStatus
            FROM jobcard j
            LEFT JOIN booking b ON j.bookingId = b.bookingId
            ORDER BY j.jobcardId DESC
            LIMIT 5
        `);

    if (jobcards.length === 0) {
      console.log("⚠️  No jobcards found in database.");
    } else {
      console.log(`Found ${jobcards.length} jobcard(s):`);
      console.table(jobcards);
    }

    // Step 4: Check jobcardMechanic assignments
    console.log(
      "\n📊 Step 4: Checking mechanic assignments in jobcardMechanic table...\n"
    );
    const [assignments] = await connection.query(`
            SELECT 
                jm.jobcardMechanicId,
                jm.jobcardId,
                jm.mechanicId,
                m.mechanicName,
                m.mechanicCode,
                jm.assignedAt,
                j.bookingId,
                b.vehicleNumber
            FROM jobcardMechanic jm
            LEFT JOIN mechanic m ON jm.mechanicId = m.mechanicId
            LEFT JOIN jobcard j ON jm.jobcardId = j.jobcardId
            LEFT JOIN booking b ON j.bookingId = b.bookingId
            ORDER BY jm.assignedAt DESC
            LIMIT 10
        `);

    if (assignments.length === 0) {
      console.log(
        "⚠️  No mechanic assignments found in jobcardMechanic table."
      );
    } else {
      console.log(`Found ${assignments.length} mechanic assignment(s):`);
      console.table(assignments);
    }

    // Step 5: Show detailed view with mechanics per jobcard
    console.log(
      "\n📊 Step 5: Detailed view - Mechanics assigned to each jobcard...\n"
    );

    for (const jobcard of jobcards) {
      const [mechanics] = await connection.query(
        `
                SELECT 
                    m.mechanicId,
                    m.mechanicName,
                    m.mechanicCode,
                    m.availability,
                    jm.assignedAt
                FROM jobcardMechanic jm
                INNER JOIN mechanic m ON jm.mechanicId = m.mechanicId
                WHERE jm.jobcardId = ?
                ORDER BY jm.assignedAt
            `,
        [jobcard.jobcardId]
      );

      console.log(
        `\n🔧 Jobcard #${jobcard.jobcardId} (Booking: ${jobcard.bookingId} - ${jobcard.vehicleNumber})`
      );
      console.log(`   Status: ${jobcard.status}`);
      console.log(`   Part Code: ${jobcard.partCode}`);
      console.log(`   Primary Mechanic ID: ${jobcard.primaryMechanicId}`);
      console.log(`   Assigned Mechanics (${mechanics.length}):`);

      if (mechanics.length === 0) {
        console.log("     ⚠️  No mechanics assigned to this jobcard");
      } else {
        mechanics.forEach((mech, idx) => {
          console.log(
            `     ${idx + 1}. ${mech.mechanicName} (${
              mech.mechanicCode
            }) - ID: ${mech.mechanicId} - ${mech.availability}`
          );
        });
      }
    }

    // Step 6: Summary statistics
    console.log("\n" + "=".repeat(70));
    console.log("📈 SUMMARY STATISTICS");
    console.log("=".repeat(70));

    const [stats] = await connection.query(`
            SELECT 
                COUNT(DISTINCT j.jobcardId) as total_jobcards,
                COUNT(DISTINCT jm.mechanicId) as total_assigned_mechanics,
                COUNT(jm.jobcardMechanicId) as total_assignments
            FROM jobcard j
            LEFT JOIN jobcardMechanic jm ON j.jobcardId = jm.jobcardId
        `);

    console.log(`\n   Total Jobcards: ${stats[0].total_jobcards}`);
    console.log(
      `   Total Unique Mechanics Assigned: ${stats[0].total_assigned_mechanics}`
    );
    console.log(`   Total Mechanic Assignments: ${stats[0].total_assignments}`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ VERIFICATION COMPLETE");
    console.log("=".repeat(70));

    console.log("\n💡 How It Works:");
    console.log('   1. When you select mechanics and click "Assign Mechanics"');
    console.log("   2. Backend updates/creates jobcard with primary mechanic");
    console.log(
      "   3. All selected mechanic IDs are stored in jobcardMechanic table"
    );
    console.log(
      "   4. Each mechanic ID is linked to the jobcard via jobcardId"
    );
    console.log('   5. Mechanics availability is updated to "Busy"');
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyMechanicAssignment()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
