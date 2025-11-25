const db = require("./config/db");

async function cleanEshopDuplicates() {
  try {
    console.log("Cleaning up duplicate eshop records...");

    // First, let's see which records are duplicates
    const [duplicates] = await db.execute(`
            SELECT itemCode, COUNT(*) as count
            FROM eshop
            GROUP BY itemCode
            HAVING count > 1
        `);

    console.log("Duplicate itemCodes found:", duplicates);

    if (duplicates.length > 0) {
      // Keep the record with the lowest itemId for each duplicate
      for (const dup of duplicates) {
        const [records] = await db.execute(
          "SELECT itemId FROM eshop WHERE itemCode = ? ORDER BY itemId ASC",
          [dup.itemCode]
        );

        // Delete all but the first record
        for (let i = 1; i < records.length; i++) {
          await db.execute("DELETE FROM eshop WHERE itemId = ?", [
            records[i].itemId,
          ]);
          console.log(`Deleted duplicate record ID: ${records[i].itemId}`);
        }
      }
    }

    console.log("Making itemCode column NOT NULL and UNIQUE...");

    // Make the column NOT NULL and UNIQUE
    await db.execute(`
            ALTER TABLE eshop
            MODIFY COLUMN itemCode VARCHAR(50) NOT NULL UNIQUE
        `);

    console.log("Cleanup completed successfully!");

    // Verify the final state
    const [finalRows] = await db.execute(
      "SELECT itemId, itemCode, itemName FROM eshop ORDER BY itemId"
    );
    console.log("\nFinal records:");
    finalRows.forEach((row) => {
      console.log(
        `- ID: ${row.itemId}, Code: '${row.itemCode}', Name: ${row.itemName}`
      );
    });
  } catch (error) {
    console.error("Error cleaning up duplicates:", error.message);
  } finally {
    process.exit();
  }
}

cleanEshopDuplicates();
