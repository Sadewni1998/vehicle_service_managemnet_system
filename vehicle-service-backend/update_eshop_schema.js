const db = require("./config/db");

async function updateEshopSchema() {
  try {
    console.log("Adding itemCode column to eshop table...");

    // First check if column already exists
    const [columns] = await db.execute(`
            SHOW COLUMNS FROM eshop LIKE 'itemCode'
        `);

    if (columns.length > 0) {
      console.log("itemCode column already exists. Skipping schema update.");
      return;
    }

    // Add itemCode column as nullable first
    await db.execute(`
            ALTER TABLE eshop
            ADD COLUMN itemCode VARCHAR(50) NULL AFTER itemId
        `);

    console.log("Column added successfully. Populating existing records...");

    // Update existing records with itemCodes
    const updates = [
      { itemCode: "TOY-ENG-001", itemName: "Toyota Engine Oil Filter" },
      { itemCode: "HON-BRK-002", itemName: "Honda Brake Pads Set" },
      { itemCode: "SUZ-FLT-003", itemName: "Suzuki Air Filter" },
      { itemCode: "FOR-ENG-004", itemName: "Ford Engine Mount" },
      { itemCode: "MAZ-SUS-005", itemName: "Mazda Suspension Strut" },
      { itemCode: "ISU-ELE-006", itemName: "Isuzu Alternator" },
      { itemCode: "SUB-ENG-007", itemName: "Subaru Timing Belt" },
    ];

    for (const update of updates) {
      await db.execute("UPDATE eshop SET itemCode = ? WHERE itemName = ?", [
        update.itemCode,
        update.itemName,
      ]);
    }

    // Now make the column NOT NULL and UNIQUE
    await db.execute(`
            ALTER TABLE eshop
            MODIFY COLUMN itemCode VARCHAR(50) NOT NULL UNIQUE
        `);

    console.log("Schema update completed successfully!");
    console.log("All existing eshop items now have itemCodes.");
  } catch (error) {
    console.error("Error updating schema:", error.message);
  } finally {
    process.exit();
  }
}

updateEshopSchema();
