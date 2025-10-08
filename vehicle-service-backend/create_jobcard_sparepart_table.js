/**
 * Migration Script: Create jobcardSparePart Junction Table
 *
 * Purpose: Store all assigned spare parts for each jobcard
 * Similar to jobcardMechanic table but for spare parts
 *
 * Run: node create_jobcard_sparepart_table.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function createJobcardSparePartTable() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("Connected to database successfully");

    // Create jobcardSparePart table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS jobcardSparePart (
        jobcardSparePartId INT NOT NULL AUTO_INCREMENT,
        jobcardId INT NOT NULL,
        partId INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unitPrice DECIMAL(10, 2) NOT NULL,
        totalPrice DECIMAL(10, 2) NOT NULL,
        assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usedAt TIMESTAMP NULL,
        PRIMARY KEY (jobcardSparePartId),
        FOREIGN KEY (jobcardId) REFERENCES jobcard(jobcardId) ON DELETE CASCADE,
        FOREIGN KEY (partId) REFERENCES spareparts(partId) ON DELETE RESTRICT,
        INDEX idx_jobcard_id (jobcardId),
        INDEX idx_part_id (partId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableQuery);
    console.log("✅ Table jobcardSparePart created successfully!");

    // Check table structure
    const [columns] = await connection.query("DESCRIBE jobcardSparePart");

    console.log("\n📊 Table Structure:");
    console.log("Columns:", columns.length);
    columns.forEach((col) => {
      console.log(
        `  - ${col.Field} (${col.Type}) ${col.Key ? `[${col.Key}]` : ""}`
      );
    });

    // Check existing jobcards
    const [jobcards] = await connection.query(
      "SELECT COUNT(*) as count FROM jobcard"
    );
    console.log(`\n📋 Existing jobcards: ${jobcards[0].count}`);

    // Check existing spare parts
    const [spareParts] = await connection.query(
      "SELECT COUNT(*) as count FROM spareparts WHERE isActive = true"
    );
    console.log(`🔧 Active spare parts: ${spareParts[0].count}`);

    console.log("\n✅ Migration completed successfully!");
    console.log(
      "💡 The jobcardSparePart table is ready to store spare part assignments."
    );
  } catch (error) {
    console.error("❌ Error during migration:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n📤 Database connection closed");
    }
  }
}

// Run the migration
createJobcardSparePartTable()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
