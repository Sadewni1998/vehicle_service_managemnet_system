const mysql = require("mysql2/promise");
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

(async () => {
  const DB_HOST = process.env.DB_HOST || "localhost";
  const DB_USER = process.env.DB_USER || "root";
  const DB_PASSWORD = process.env.DB_PASSWORD || "";
  const DB_NAME = process.env.DB_NAME || "vehicle_service_db";

  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    console.log("Checking if 'brand' column exists in 'spareparts' table...");

    const [columns] = await conn.execute(
      "SHOW COLUMNS FROM spareparts LIKE 'brand'"
    );

    if (columns.length === 0) {
      console.log("Adding 'brand' column to 'spareparts' table...");
      await conn.execute(
        "ALTER TABLE spareparts ADD COLUMN brand VARCHAR(100) AFTER partName"
      );
      console.log("Column 'brand' added successfully.");
    } else {
      console.log("Column 'brand' already exists.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (conn) await conn.end();
  }
})();
