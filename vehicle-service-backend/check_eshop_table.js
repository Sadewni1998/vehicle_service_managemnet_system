const db = require("./config/db");

async function checkEshopTable() {
  try {
    console.log("Checking eshop table structure...");

    // Check table structure
    const [columns] = await db.execute("DESCRIBE eshop");
    console.log("Table columns:");
    columns.forEach((col) => {
      console.log(
        `- ${col.Field}: ${col.Type} ${
          col.Null === "NO" ? "NOT NULL" : "NULL"
        } ${col.Key}`
      );
    });

    console.log("\nChecking existing data...");
    const [rows] = await db.execute(
      "SELECT itemId, itemCode, itemName FROM eshop"
    );
    console.log("Existing records:");
    rows.forEach((row) => {
      console.log(
        `- ID: ${row.itemId}, Code: '${row.itemCode}', Name: ${row.itemName}`
      );
    });
  } catch (error) {
    console.error("Error checking table:", error.message);
  } finally {
    process.exit();
  }
}

checkEshopTable();
