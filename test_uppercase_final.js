import axios from "axios";

async function testUppercaseVehicle() {
  console.log("Testing uppercase vehicle number conversion...\n");

  try {
    // Test with a lowercase vehicle number
    const testVehicleData = {
      vehicleNumber: "xyz-789-test" + Date.now(), // lowercase input
      vehicleType: "Car",
      vehicleBrand: "Honda",
      vehicleModel: "Civic",
    };

    console.log(
      "Input vehicle number (lowercase):",
      testVehicleData.vehicleNumber
    );

    // Login first to get token (using existing customer)
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "john.doe@example.com",
        password: "password123",
      }
    );

    const token = loginResponse.data.token;
    console.log("Login successful, token obtained");

    // Add vehicle using the API
    const addVehicleResponse = await axios.post(
      "http://localhost:5000/api/vehicles",
      testVehicleData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Vehicle added successfully!");
    console.log("Response data:", addVehicleResponse.data);

    // Check if vehicle number was stored in uppercase
    if (
      addVehicleResponse.data.vehicle &&
      addVehicleResponse.data.vehicle.vehicle_number
    ) {
      const storedVehicleNumber =
        addVehicleResponse.data.vehicle.vehicle_number;
      console.log("\nStored vehicle number:", storedVehicleNumber);
      console.log(
        "Is uppercase?",
        storedVehicleNumber === testVehicleData.vehicleNumber.toUpperCase()
      );

      if (storedVehicleNumber === testVehicleData.vehicleNumber.toUpperCase()) {
        console.log(
          "✅ SUCCESS: Vehicle number correctly converted to uppercase!"
        );
      } else {
        console.log("❌ FAILED: Vehicle number not converted to uppercase");
      }
    }

    // Also test by fetching all vehicles to verify display
    const vehiclesResponse = await axios.get(
      "http://localhost:5000/api/vehicles",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("\nAll vehicles for user:");
    vehiclesResponse.data.vehicles.forEach((vehicle) => {
      console.log(`- ${vehicle.vehicle_number} (${vehicle.vehicle_type})`);
    });
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

testUppercaseVehicle();
