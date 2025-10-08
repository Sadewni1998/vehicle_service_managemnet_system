const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "vehicle_service_db",
};

async function addMechanicNameColumn() {
  let connection;

  try {
    console.log("🔌 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);

    // Check if column already exists
    const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'vehicle_service_db' 
            AND TABLE_NAME = 'mechanic' 
            AND COLUMN_NAME = 'mechanicName'
        `);

    if (columns.length > 0) {
      console.log("⚠️  mechanicName column already exists!");
      return;
    }

    console.log("➕ Adding mechanicName column to mechanic table...");

    // Step 1: Add column
    await connection.query(`
            ALTER TABLE mechanic 
            ADD COLUMN mechanicName VARCHAR(50) AFTER staffId
        `);
    console.log("✅ Column added successfully!");

    // Step 2: Populate with existing names from staff table
    console.log("📝 Populating with existing names...");
    const [updateResult] = await connection.query(`
            UPDATE mechanic m
            INNER JOIN staff s ON m.staffId = s.staffId
            SET m.mechanicName = s.name
        `);
    console.log(
      `✅ Updated ${updateResult.affectedRows} mechanic records with names`
    );

    // Step 3: Make it NOT NULL
    console.log("🔒 Making mechanicName NOT NULL...");
    await connection.query(`
            ALTER TABLE mechanic 
            MODIFY COLUMN mechanicName VARCHAR(50) NOT NULL
        `);
    console.log("✅ Column is now NOT NULL");

    // Step 4: Update the view
    console.log("🔄 Updating mechanic_details view...");
    await connection.query("DROP VIEW IF EXISTS mechanic_details");
    await connection.query(`
            CREATE VIEW mechanic_details AS
            SELECT 
                m.mechanicId,
                m.staffId,
                m.mechanicCode,
                m.mechanicName,
                s.email,
                m.specialization,
                m.experienceYears as experience,
                m.certifications,
                m.availability,
                m.hourlyRate,
                m.isActive,
                m.createdAt,
                m.updatedAt
            FROM mechanic m
            INNER JOIN staff s ON m.staffId = s.staffId
            WHERE m.isActive = true
        `);
    console.log("✅ View updated successfully!");

    // Step 5: Verify the changes
    console.log("\n📊 Verification:");
    const [mechanics] = await connection.query(
      "SELECT * FROM mechanic_details"
    );
    console.log(`Found ${mechanics.length} mechanics:`);
    mechanics.forEach((m) => {
      console.log(`  - ${m.mechanicName} (${m.mechanicCode})`);
    });

    console.log(
      "\n✨ All done! mechanicName column has been added successfully!"
    );
    console.log("📝 You can now change mechanic names directly:");
    console.log(
      '   UPDATE mechanic SET mechanicName = "New Name" WHERE mechanicId = ?;'
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addMechanicNameColumn()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
