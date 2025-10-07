import axios from "axios";

async function testVehicleAPI() {
  console.log("🧪 Testing Vehicle API endpoint...\n");

  try {
    // Register a new test user with vehicles
    const testUser = {
      name: "API Test User",
      email: "apitest" + Date.now() + "@example.com",
      password: "password123",
      phone: "0770000001",
      address: "123 Test Street",
      vehicles: [
        {
          vehicleNumber: "API-TEST-" + Date.now(),
          brand: "Toyota",
          model: "Camry",
          type: "Sedan",
          manufactureYear: "2020",
          fuelType: "Petrol",
          transmission: "Automatic",
        },
        {
          vehicleNumber: "API-TEST2-" + Date.now(),
          brand: "Honda",
          model: "Civic",
          type: "Hatchback",
          manufactureYear: "2019",
          fuelType: "Petrol",
          transmission: "Manual",
        },
      ],
    };

    console.log("1. Registering test user...");
    await axios.post("http://localhost:5000/api/auth/register", testUser);
    console.log("✅ User registered successfully");

    // Login with the new user
    console.log("2. Attempting to login...");
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: testUser.email,
        password: testUser.password,
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login successful, token obtained");

    // Now test the vehicle API
    console.log("3. Fetching user vehicles...");
    const vehicleResponse = await axios.get(
      "http://localhost:5000/api/vehicles",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Vehicle API response received");
    console.log("📊 Response structure:", {
      status: vehicleResponse.status,
      success: vehicleResponse.data.success,
      message: vehicleResponse.data.message,
      dataLength: vehicleResponse.data.data?.length || 0,
    });

    if (vehicleResponse.data.data && vehicleResponse.data.data.length > 0) {
      console.log("\n🚗 Vehicles found:");
      vehicleResponse.data.data.forEach((vehicle, index) => {
        console.log(`  ${index + 1}. Vehicle ID: ${vehicle.vehicleId}`);
        console.log(`     Number: ${vehicle.vehicleNumber}`);
        console.log(`     Type: ${vehicle.type}`);
        console.log(`     Brand: ${vehicle.brand}`);
        console.log(`     Model: ${vehicle.model}`);
        console.log(`     Manufacture Year: ${vehicle.manufactureYear}`);
        console.log(`     Fuel Type: ${vehicle.fuelType}`);
        console.log(`     Transmission: ${vehicle.transmission}\n`);
      });
      console.log("✅ Vehicle API is working correctly for booking form!");
    } else {
      console.log("❌ No vehicles found for this user");
    }
  } catch (error) {
    console.error("❌ API Test failed:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log(
        "🔐 Authentication issue - check if user exists and password is correct"
      );
    }
    if (error.code === "ECONNREFUSED") {
      console.log(
        "🔌 Connection refused - check if backend server is running on port 5000"
      );
    }
  }
}

testVehicleAPI();
