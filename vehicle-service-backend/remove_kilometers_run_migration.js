const mysql = require("mysql2/promise");
require("dotenv").config();

async function removeKilometersRunColumn() {
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

    // Check if the column exists before dropping it
    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'booking' AND COLUMN_NAME = 'kilometersRun'
    `,
      [process.env.DB_NAME || "vehicle_service_db"]
    );

    if (columns.length > 0) {
      console.log("Dropping kilometersRun column from booking table...");

      // Drop the column
      await connection.query("ALTER TABLE booking DROP COLUMN kilometersRun");

      console.log(
        "✅ Successfully removed kilometersRun column from booking table"
      );
    } else {
      console.log("⚠️  Column kilometersRun does not exist in booking table");
    }

    // Verify the change
    const [tableStructure] = await connection.query("DESCRIBE booking");
    console.log("\n📋 Updated booking table structure:");
    tableStructure.forEach((column) => {
      console.log(`  - ${column.Field} (${column.Type})`);
    });
  } catch (error) {
    console.error("❌ Error removing kilometersRun column:", error.message);

    if (error.code === "ER_CANT_DROP_FIELD_OR_KEY") {
      console.log(
        "Column may not exist or may be referenced by other constraints"
      );
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run the migration
removeKilometersRunColumn();
