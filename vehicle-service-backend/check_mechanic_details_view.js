const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "vehicle_service_db",
};

async function checkMechanicDetailsView() {
  let connection;

  try {
    console.log("🔌 Connecting to database...\n");
    connection = await mysql.createConnection(dbConfig);

    // Check if view exists
    const [views] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'vehicle_service_db' 
            AND TABLE_NAME = 'mechanic_details'
            AND TABLE_TYPE = 'VIEW'
        `);

    if (views.length === 0) {
      console.log("❌ mechanic_details view does NOT exist!\n");
      console.log("Creating the view now...\n");

      // Create the view
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
            `);

      console.log("✅ mechanic_details view created successfully!\n");
    } else {
      console.log("✅ mechanic_details view exists!\n");
    }

    // Test the view
    console.log("📊 Testing the view:\n");
    const [mechanics] = await connection.query(`
            SELECT * FROM mechanic_details WHERE isActive = true LIMIT 3
        `);

    console.log(`Found ${mechanics.length} mechanic(s):\n`);
    console.table(mechanics);
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMechanicDetailsView()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
