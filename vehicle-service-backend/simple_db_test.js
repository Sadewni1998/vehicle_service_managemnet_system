// simple_db_test.js
// Simple test to check database connection and vehicle table

const mysql = require("mysql2/promise");
require("dotenv").config();

async function testDatabase() {
  try {
    console.log("Testing database connection...");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "vehicle_service_db",
    });

    console.log("✅ Database connected successfully!");

    // Check if vehicle table exists and has the right structure
    console.log("\nChecking vehicle table structure...");
    const [tableInfo] = await connection.execute("DESCRIBE vehicle");
    console.log(
      "Vehicle table columns:",
      tableInfo.map((col) => col.Field)
    );

    // Check if there are any vehicles in the database
    console.log("\nChecking existing vehicles...");
    const [vehicles] = await connection.execute(
      "SELECT * FROM vehicle ORDER BY createdAt DESC LIMIT 5"
    );
    console.log(`Found ${vehicles.length} vehicles in database:`);

    vehicles.forEach((vehicle, index) => {
      console.log(
        `${index + 1}. Vehicle ID: ${vehicle.vehicleId}, Number: ${
          vehicle.vehicleNumber
        }, Customer: ${vehicle.customerId}`
      );
    });

    // Check if customer table has entries
    console.log("\nChecking customers...");
    const [customers] = await connection.execute(
      "SELECT customerId, name, email FROM customer ORDER BY createdAt DESC LIMIT 5"
    );
    console.log(`Found ${customers.length} customers in database:`);

    customers.forEach((customer, index) => {
      console.log(
        `${index + 1}. Customer ID: ${customer.customerId}, Name: ${
          customer.name
        }, Email: ${customer.email}`
      );
    });

    await connection.end();
    console.log("\n✅ Database test completed successfully!");
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
  }
}

testDatabase();
