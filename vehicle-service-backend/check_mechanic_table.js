// Check the actual structure of the mechanic table
const mysql = require("mysql2/promise");

const checkMechanicTable = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("Connected to database\n");

    // Check if mechanic table exists
    console.log("Checking mechanic table structure...");
    const [columns] = await connection.execute("DESCRIBE mechanic");

    console.log("\nMechanic table columns:");
    columns.forEach((col) => {
      console.log(
        `  - ${col.Field} (${col.Type}) ${
          col.Null === "NO" ? "NOT NULL" : "NULL"
        } ${col.Key ? `[${col.Key}]` : ""}`
      );
    });

    // Check sample data
    console.log("\nSample data from mechanic table:");
    const [mechanics] = await connection.execute(
      "SELECT * FROM mechanic LIMIT 3"
    );
    console.log(JSON.stringify(mechanics, null, 2));

    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

checkMechanicTable();
