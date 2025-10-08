// Check database for existing users and create test user if needed
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const testDatabase = async () => {
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("✅ Connected to database");

    // Check existing customers
    console.log("\n📋 Checking existing customers...");
    const [customers] = await connection.execute(
      "SELECT customerId, name, email, phone FROM customers LIMIT 5"
    );

    console.log("Existing customers:");
    customers.forEach((customer) => {
      console.log(
        `- ID: ${customer.customerId}, Name: ${customer.name}, Email: ${customer.email}`
      );
    });

    // Check if test user exists
    const [testUsers] = await connection.execute(
      "SELECT * FROM customers WHERE email = ?",
      ["test@example.com"]
    );

    if (testUsers.length === 0) {
      console.log("\n➕ Creating test user...");
      const hashedPassword = await bcrypt.hash("password123", 10);

      const [result] = await connection.execute(
        "INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)",
        ["Test User", "test@example.com", "1234567890", hashedPassword]
      );

      console.log("✅ Test user created with ID:", result.insertId);

      // Create test vehicle for this user
      await connection.execute(
        "INSERT INTO vehicles (customerId, vehicleNumber, brand, model, type, manufactureYear, fuelType, transmission) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          result.insertId,
          "TEST-DASH-001",
          "Toyota",
          "Corolla",
          "sedan",
          2020,
          "petrol",
          "automatic",
        ]
      );

      console.log("✅ Test vehicle created for user");
    } else {
      console.log(
        "\n✅ Test user already exists with ID:",
        testUsers[0].customerId
      );

      // Check vehicles for this user
      const [userVehicles] = await connection.execute(
        "SELECT * FROM vehicles WHERE customerId = ?",
        [testUsers[0].customerId]
      );

      console.log(`📋 User has ${userVehicles.length} vehicles:`);
      userVehicles.forEach((vehicle) => {
        console.log(
          `- ${vehicle.vehicleNumber}: ${vehicle.brand} ${vehicle.model}`
        );
      });
    }

    await connection.end();
    console.log("\n🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
};

testDatabase();
