const db = require("./config/db");

async function testDB() {
  try {
    console.log("Testing database connection...");

    // Simple select
    const [rows] = await db.execute("SELECT 1 as test");
    console.log("DB test result:", rows);

    // Check eshop table structure
    const [columns] = await db.execute("DESCRIBE eshop");
    console.log("Eshop table columns:");
    columns.forEach((col) => {
      console.log(
        `- ${col.Field}: ${col.Type} ${col.Null === "NO" ? "NOT NULL" : "NULL"}`
      );
    });

    // Try a simple insert
    console.log("Trying simple insert...");
    const [result] = await db.execute(
      "INSERT INTO eshop (itemCode, itemName, price, quantity, itemBrand, itemType) VALUES (?, ?, ?, ?, ?, ?)",
      ["TEST001", "Test Item", 100.0, 10, "Toyota", "Engine Parts"]
    );
    console.log("Insert result:", result);
  } catch (error) {
    console.error("DB error:", error.message);
  } finally {
    process.exit();
  }
}

testDB();
