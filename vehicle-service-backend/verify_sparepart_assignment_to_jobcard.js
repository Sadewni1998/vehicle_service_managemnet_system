/**
 * Verification Script: Test Spare Parts Storage in jobcardSparePart Table
 *
 * Purpose: Verify that spare parts are correctly stored when assigned
 *
 * Run: node verify_sparepart_assignment_to_jobcard.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function verifySparePartAssignment() {
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

    // Check jobcardSparePart table structure
    console.log("📊 Checking jobcardSparePart table structure...");
    const [columns] = await connection.query("DESCRIBE jobcardSparePart");
    console.log(
      `Table has ${columns.length} columns:`,
      columns.map((c) => c.Field).join(", ")
    );
    console.log();

    // Check existing jobcards
    console.log("📋 Checking existing jobcards...");
    const [jobcards] = await connection.query(`
      SELECT 
        j.jobcardId, 
        j.bookingId, 
        j.mechanicId, 
        j.status,
        j.partCode,
        b.vehicleNumber
      FROM jobcard j
      LEFT JOIN booking b ON j.bookingId = b.bookingId
      ORDER BY j.jobcardId DESC
    `);

    if (jobcards.length === 0) {
      console.log(
        "⚠️ No jobcards found. Create a jobcard first (booking must have arrived status)."
      );
      return;
    }

    console.log(`Found ${jobcards.length} jobcard(s):`);
    jobcards.forEach((jc) => {
      console.log(
        `  - Jobcard #${jc.jobcardId}: Booking ${jc.bookingId} (${jc.vehicleNumber}), Status: ${jc.status}, Part Code: ${jc.partCode}`
      );
    });
    console.log();

    // Check spare part assignments in jobcardSparePart table
    console.log(
      "🔧 Checking spare part assignments in jobcardSparePart table..."
    );
    const [sparePartAssignments] = await connection.query(`
      SELECT 
        jsp.jobcardSparePartId,
        jsp.jobcardId,
        jsp.partId,
        jsp.quantity,
        jsp.unitPrice,
        jsp.totalPrice,
        jsp.assignedAt,
        sp.partCode,
        sp.partName,
        sp.category
      FROM jobcardSparePart jsp
      LEFT JOIN spareparts sp ON jsp.partId = sp.partId
      ORDER BY jsp.jobcardId, jsp.jobcardSparePartId
    `);

    if (sparePartAssignments.length === 0) {
      console.log(
        "⚠️ No spare part assignments in jobcardSparePart table yet."
      );
      console.log("   This is expected before assigning spare parts via UI.");
    } else {
      console.log(
        `Found ${sparePartAssignments.length} spare part assignment(s):`
      );
      sparePartAssignments.forEach((spa) => {
        console.log(
          `  - Assignment #${spa.jobcardSparePartId}: Jobcard #${spa.jobcardId}`
        );
        console.log(
          `    Part: ${spa.partCode} - ${spa.partName} (${spa.category})`
        );
        console.log(
          `    Quantity: ${spa.quantity}, Unit Price: Rs. ${spa.unitPrice}, Total: Rs. ${spa.totalPrice}`
        );
        console.log(`    Assigned at: ${spa.assignedAt}`);
        console.log();
      });
    }

    // Check available spare parts
    console.log("🛠️ Available spare parts in database:");
    const [availableParts] = await connection.query(`
      SELECT partId, partCode, partName, category, unitPrice, stockQuantity, isActive
      FROM spareparts
      WHERE isActive = true
      ORDER BY partId
    `);

    console.log(`Found ${availableParts.length} active spare part(s):`);
    availableParts.forEach((part) => {
      console.log(
        `  - Part #${part.partId}: ${part.partCode} - ${part.partName}`
      );
      console.log(
        `    Category: ${part.category}, Price: Rs. ${part.unitPrice}, Stock: ${part.stockQuantity}`
      );
    });
    console.log();

    // Statistics
    console.log("📊 Statistics:");
    const [stats] = await connection.query(`
      SELECT 
        COUNT(DISTINCT j.jobcardId) as totalJobcards,
        COUNT(DISTINCT jsp.jobcardId) as jobcardsWithSpareParts,
        COUNT(jsp.jobcardSparePartId) as totalSparePartAssignments,
        SUM(jsp.totalPrice) as totalSparePartsCost
      FROM jobcard j
      LEFT JOIN jobcardSparePart jsp ON j.jobcardId = jsp.jobcardId
    `);

    console.log(`  Total jobcards: ${stats[0].totalJobcards}`);
    console.log(
      `  Jobcards with spare parts: ${stats[0].jobcardsWithSpareParts}`
    );
    console.log(
      `  Total spare part assignments: ${
        stats[0].totalSparePartAssignments || 0
      }`
    );
    console.log(
      `  Total spare parts cost: Rs. ${stats[0].totalSparePartsCost || 0}`
    );
    console.log();

    console.log("✅ Verification completed!\n");

    // Instructions
    console.log("📝 To test spare part assignment:");
    console.log("1. Start the backend server: npm start");
    console.log("2. Login as Service Advisor");
    console.log('3. Go to "Assign Jobs" tab');
    console.log('4. Click "Assign Spare-parts" on a booking');
    console.log("5. Select spare parts and quantities");
    console.log('6. Click "Assign Selected Parts"');
    console.log("7. Run this script again to see the stored spare parts!");
  } catch (error) {
    console.error("❌ Error during verification:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n📤 Database connection closed");
    }
  }
}

// Run the verification
verifySparePartAssignment()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
