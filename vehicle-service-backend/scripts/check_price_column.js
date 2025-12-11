const db = require("../config/db");

async function checkColumn() {
  try {
    const [rows] = await db.query(
      "SHOW COLUMNS FROM breakdown_request LIKE 'price'"
    );
    if (rows.length > 0) {
      console.log("Column 'price' exists.");
    } else {
      console.log("Column 'price' DOES NOT exist.");
    }
  } catch (error) {
    console.error("Error checking column:", error);
  } finally {
    process.exit();
  }
}

checkColumn();
