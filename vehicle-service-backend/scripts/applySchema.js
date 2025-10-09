/* scripts/applySchema.js
 * Apply the database schema from db_setup.sql using mysql2 and environment variables.
 * - Uses DB_HOST, DB_USER, DB_PASSWORD, DB_NAME from .env
 * - Creates the database if it doesn't exist
 * - Executes the schema with multiple statements enabled
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

(async () => {
  const DB_HOST = process.env.DB_HOST || "localhost";
  const DB_USER = process.env.DB_USER || "root";
  const DB_PASSWORD = process.env.DB_PASSWORD || "";
  const DB_NAME = process.env.DB_NAME || "vehicle_service_db";

  const sqlPath = path.join(__dirname, "..", "db_setup.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error("❌ Schema file not found at", sqlPath);
    process.exit(1);
  }

  const rawSQL = fs.readFileSync(sqlPath, "utf8");

  // Remove any existing CREATE DATABASE/USE statements to avoid conflicts
  const strippedSQL = rawSQL
    .replace(/\uFEFF/g, "") // strip BOM if present
    .replace(/CREATE\s+DATABASE[\s\S]*?;\s*/gi, "")
    .replace(/USE\s+[^;]+;\s*/gi, "");

  const preamble = `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;\nUSE \`${DB_NAME}\`;`;
  const finalSQL = `${preamble}\n\n${strippedSQL}`;

  let conn;
  try {
    console.log("🔗 Connecting to MySQL...", { host: DB_HOST, user: DB_USER });
    conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });

    console.log(`🛠️ Applying schema to database: ${DB_NAME}`);

    // Execute statements one by one to gracefully handle duplicates
    const statements = finalSQL
      .split(/;\s*\n|;\s*$/gm)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        // Ignore safe idempotent errors so reruns don't fail
        const ignorableCodes = new Set([
          "ER_TABLE_EXISTS_ERROR", // 1050
          "ER_DUP_KEYNAME", // 1061 duplicate index
          "ER_DUP_ENTRY", // 1062 duplicate row
          "ER_CANNOT_ADD_FOREIGN", // 1215 (may occur out of order)
          "ER_FK_COLUMN_CANNOT_DROP",
          "ER_DB_CREATE_EXISTS",
        ]);
        if (ignorableCodes.has(err.code)) {
          console.warn(
            `⚠️ Skipping statement due to ${err.code}:`,
            stmt.slice(0, 120) + (stmt.length > 120 ? "…" : "")
          );
          continue;
        }
        throw err;
      }
    }

    console.log("✅ Database schema applied successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error applying schema:", err.message);
    process.exit(1);
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch (_) {}
    }
  }
})();
