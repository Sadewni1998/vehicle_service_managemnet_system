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

    const [columns] = await conn.execute("DESCRIBE spareparts");
    console.log("Columns in spareparts table:");
    columns.forEach((col) => {
      console.log(`${col.Field} (${col.Type})`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (conn) await conn.end();
  }
})();
