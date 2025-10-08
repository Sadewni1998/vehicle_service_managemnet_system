// test_vehicle_registration.js
// Test script to verify vehicle registration functionality

const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";

async function testVehicleRegistration() {
  try {
    console.log("Testing vehicle registration...");

    // Test registration data with vehicle information
    const registrationData = {
      name: "Test User",
      email: `test${Date.now()}@example.com`, // Unique email
      password: "password123",
      phone: "0771234567",
      address: "Test Address",
      vehicles: [
        {
          vehicleNumber: `TEST-${Date.now()}`,
          brand: "toyota",
          model: "Camry",
          type: "sedan",
          manufactureYear: 2020,
          fuelType: "petrol",
          transmission: "auto",
        },
      ],
    };

    console.log("Sending registration request...");
    console.log("Data:", JSON.stringify(registrationData, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/auth/register`,
      registrationData
    );

    console.log("Registration successful!");
    console.log("Response:", response.data);

    // Extract token and customer ID
    const { token, user } = response.data;
    console.log(`Customer ID: ${user.id}`);

    // Now test fetching vehicles for this user
    console.log("\nTesting vehicle retrieval...");

    const vehicleResponse = await axios.get(`${API_BASE_URL}/vehicles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Vehicles retrieved successfully!");
    console.log("Vehicles:", JSON.stringify(vehicleResponse.data, null, 2));

    if (vehicleResponse.data.data && vehicleResponse.data.data.length > 0) {
      console.log(
        "\n✅ SUCCESS: Vehicle data is being stored and retrieved correctly!"
      );
      console.log(
        `Found ${vehicleResponse.data.data.length} vehicle(s) in the database.`
      );
    } else {
      console.log(
        "\n❌ ERROR: No vehicles found in database after registration!"
      );
    }
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testVehicleRegistration();
