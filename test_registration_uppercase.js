import axios from "axios";

async function testUppercaseRegistration() {
  console.log(
    "Testing uppercase vehicle number conversion during registration...\n"
  );

  try {
    // Test registration with lowercase vehicle number
    const testRegistrationData = {
      name: "Test User",
      email: "testuser" + Date.now() + "@example.com",
      password: "password123",
      phone: "1234567890",
      address: "123 Test Street",
      vehicles: [
        {
          vehicleNumber: "abc-123-test" + Date.now(), // lowercase input
          brand: "Toyota",
          model: "Camry",
          type: "Car",
          manufactureYear: "2020",
          fuelType: "Petrol",
          transmission: "Automatic",
        },
      ],
    };

    console.log(
      "Input vehicle number (lowercase):",
      testRegistrationData.vehicles[0].vehicleNumber
    );

    // Register user with vehicle
    const registrationResponse = await axios.post(
      "http://localhost:5000/api/auth/register",
      testRegistrationData
    );

    console.log("Registration successful!");
    console.log("Response message:", registrationResponse.data.message);

    // Login with the new user to get token
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: testRegistrationData.email,
        password: testRegistrationData.password,
      }
    );

    const token = loginResponse.data.token;
    console.log("Login successful, token obtained");

    // Fetch vehicles to check if they were stored in uppercase
    const vehiclesResponse = await axios.get(
      "http://localhost:5000/api/vehicles",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("\nVehicles response:", vehiclesResponse.data);

    if (vehiclesResponse.data.data && vehiclesResponse.data.data.length > 0) {
      console.log("\nVehicles fetched:");
      vehiclesResponse.data.data.forEach((vehicle) => {
        console.log(`- Vehicle Number: ${vehicle.vehicleNumber}`);
        console.log(`  Type: ${vehicle.type}`);
        console.log(`  Brand: ${vehicle.brand}`);
        console.log(`  Model: ${vehicle.model}\n`);
      });

      // Check if vehicle number was converted to uppercase
      const storedVehicleNumber = vehiclesResponse.data.data[0].vehicleNumber;
      const inputVehicleNumber = testRegistrationData.vehicles[0].vehicleNumber;

      console.log("Original input:", inputVehicleNumber);
      console.log("Stored in database:", storedVehicleNumber);
      console.log("Expected uppercase:", inputVehicleNumber.toUpperCase());

      if (storedVehicleNumber === inputVehicleNumber.toUpperCase()) {
        console.log(
          "✅ SUCCESS: Vehicle number correctly converted to uppercase during registration!"
        );
      } else {
        console.log("❌ FAILED: Vehicle number not converted to uppercase");
      }
    } else {
      console.log("No vehicles found or unexpected response structure");
    }
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
    if (error.response?.data) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testUppercaseRegistration();
