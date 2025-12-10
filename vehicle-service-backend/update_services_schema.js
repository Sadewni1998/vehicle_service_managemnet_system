const db = require("./config/db");

async function updateServicesSchema() {
  try {
    console.log("Checking services table schema...");

    // Check if discount column exists
    const [columns] = await db.query(
      "SHOW COLUMNS FROM services LIKE 'discount'"
    );

    if (columns.length === 0) {
      console.log("Adding discount column to services table...");
      await db.query(
        "ALTER TABLE services ADD COLUMN discount DECIMAL(5,2) DEFAULT 0.00"
      );
      console.log("Discount column added successfully.");
    } else {
      console.log("Discount column already exists.");
    }

    console.log("Schema update completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error updating schema:", error);
    process.exit(1);
  }
}

updateServicesSchema();
