const db = require("../config/db");

async function addOtpColumns() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("Connected to database.");

    // Check if columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'vehicle_service_db' 
      AND TABLE_NAME = 'customer' 
      AND COLUMN_NAME IN ('resetOTP', 'resetOTPExpires');
    `);

    const existingColumns = columns.map((col) => col.COLUMN_NAME);

    if (!existingColumns.includes("resetOTP")) {
      console.log("Adding resetOTP column...");
      await connection.query(`
        ALTER TABLE customer 
        ADD COLUMN resetOTP VARCHAR(6) NULL;
      `);
      console.log("resetOTP column added.");
    } else {
      console.log("resetOTP column already exists.");
    }

    if (!existingColumns.includes("resetOTPExpires")) {
      console.log("Adding resetOTPExpires column...");
      await connection.query(`
        ALTER TABLE customer 
        ADD COLUMN resetOTPExpires DATETIME NULL;
      `);
      console.log("resetOTPExpires column added.");
    } else {
      console.log("resetOTPExpires column already exists.");
    }

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

addOtpColumns();
