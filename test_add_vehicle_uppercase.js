import axios from "axios";

async function testAddVehicleUppercase() {
  console.log(
    "Testing uppercase vehicle number conversion when adding new vehicle...\n"
  );

  try {
    // First, register a new user to test with
    const testUser = {
      name: "Vehicle Test User",
      email: "vehicletest" + Date.now() + "@example.com",
      password: "password123",
      phone: "1234567890",
      address: "123 Test Street",
      vehicles: [
        {
          vehicleNumber: "initial-vehicle-" + Date.now(),
          brand: "Honda",
          model: "Civic",
          type: "Car",
          manufactureYear: "2019",
          fuelType: "Petrol",
          transmission: "Manual",
        },
      ],
    };

    // Register user
    await axios.post("http://localhost:5000/api/auth/register", testUser);
    console.log("User registered successfully");

    // Login to get token
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: testUser.email,
        password: testUser.password,
      }
    );

    const token = loginResponse.data.token;
    console.log("Login successful, token obtained");

    // Now add a new vehicle with lowercase number
    const newVehicleData = {
      vehicleNumber: "xyz-456-lowercase" + Date.now(), // lowercase input
      brand: "BMW",
      model: "X3",
      type: "SUV",
      manufactureYear: "2021",
      fuelType: "Diesel",
      transmission: "Automatic",
    };

    console.log(
      "Input vehicle number (lowercase):",
      newVehicleData.vehicleNumber
    );

    // Add vehicle using the API
    const addVehicleResponse = await axios.post(
      "http://localhost:5000/api/vehicles",
      newVehicleData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Vehicle added successfully!");
    console.log("Add vehicle response:", addVehicleResponse.data);

    // Fetch all vehicles to verify the uppercase conversion
    const vehiclesResponse = await axios.get(
      "http://localhost:5000/api/vehicles",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("\nAll vehicles for user:");
    vehiclesResponse.data.data.forEach((vehicle, index) => {
      console.log(`${index + 1}. Vehicle Number: ${vehicle.vehicleNumber}`);
      console.log(
        `   Type: ${vehicle.type}, Brand: ${vehicle.brand}, Model: ${vehicle.model}\n`
      );
    });

    // Check the newly added vehicle
    const newlyAddedVehicle = vehiclesResponse.data.data.find((v) =>
      v.vehicleNumber.toLowerCase().includes("xyz-456-lowercase")
    );

    if (newlyAddedVehicle) {
      const storedVehicleNumber = newlyAddedVehicle.vehicleNumber;
      console.log("Original input:", newVehicleData.vehicleNumber);
      console.log("Stored in database:", storedVehicleNumber);
      console.log(
        "Expected uppercase:",
        newVehicleData.vehicleNumber.toUpperCase()
      );

      if (storedVehicleNumber === newVehicleData.vehicleNumber.toUpperCase()) {
        console.log(
          "✅ SUCCESS: Vehicle number correctly converted to uppercase when adding new vehicle!"
        );
      } else {
        console.log("❌ FAILED: Vehicle number not converted to uppercase");
      }
    } else {
      console.log("❌ Could not find the newly added vehicle");
    }
  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
    if (error.response?.data) {
      console.error("Response status:", error.response.status);
    }
  }
}

testAddVehicleUppercase();
