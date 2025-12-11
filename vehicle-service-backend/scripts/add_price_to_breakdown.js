const db = require("../config/db");

const addPriceColumn = async () => {
  try {
    console.log("Adding price column to breakdown_request table...");

    // Check if column exists
    const [columns] = await db.query(`
      SHOW COLUMNS FROM breakdown_request LIKE 'price'
    `);

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE breakdown_request
        ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00
      `);
      console.log("Price column added successfully.");
    } else {
      console.log("Price column already exists.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error adding price column:", error);
    process.exit(1);
  }
};

addPriceColumn();
