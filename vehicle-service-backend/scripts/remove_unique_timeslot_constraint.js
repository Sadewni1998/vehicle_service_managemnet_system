const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

(async () => {
  const DB_HOST = process.env.DB_HOST || "localhost";
  const DB_USER = process.env.DB_USER || "root";
  const DB_PASSWORD = process.env.DB_PASSWORD || "";
  const DB_NAME = process.env.DB_NAME || "vehicle_service_db";

  let conn;
  try {
    console.log("🔗 Connecting to MySQL...", { host: DB_HOST, user: DB_USER });
    conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    console.log(
      `🛠️ Removing unique constraint on (bookingDate, timeSlot) from 'booking' table...`
    );

    try {
      await conn.query("ALTER TABLE booking DROP INDEX unique_time_slot");
      console.log("✅ Successfully dropped index 'unique_time_slot'.");
    } catch (err) {
      if (err.code === "ER_CANT_DROP_FIELD_OR_KEY") {
        console.log("⚠️ Index 'unique_time_slot' does not exist. Skipping.");
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    if (conn) await conn.end();
  }
})();
