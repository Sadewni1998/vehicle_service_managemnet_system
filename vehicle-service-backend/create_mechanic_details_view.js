// Script to create the mechanic_details view
const mysql = require("mysql2/promise");

const createMechanicDetailsView = async () => {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("Connected to database");

    // Drop the view if it exists
    console.log("Dropping existing view if it exists...");
    await connection.execute("DROP VIEW IF EXISTS mechanic_details");

    // Create the mechanic_details view
    console.log("Creating mechanic_details view...");
    const createViewQuery = `
      CREATE OR REPLACE VIEW mechanic_details AS
      SELECT 
          m.mechanicId,
          m.staffId,
          m.mechanicCode,
          s.name as mechanicName,
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
    `;

    await connection.execute(createViewQuery);
    console.log("✅ mechanic_details view created successfully!");

    // Test the view
    console.log("\nTesting the view...");
    const [rows] = await connection.execute("SELECT * FROM mechanic_details");
    console.log(`Found ${rows.length} mechanics in the view:`);
    rows.forEach((mechanic) => {
      console.log(
        `  - ${mechanic.mechanicName} (${mechanic.mechanicCode}) - ${mechanic.availability}`
      );
    });

    await connection.end();
    console.log("\n✅ All done! View is ready to use.");
  } catch (error) {
    console.error("❌ Error creating view:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
};

// Run the script
createMechanicDetailsView();
