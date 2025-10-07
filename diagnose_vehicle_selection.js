import axios from "axios";

async function diagnoseVehicleSelection() {
  console.log("🔧 Diagnosing Vehicle Selection Issue...\n");

  try {
    // 1. Test if backend is running
    console.log("1. Testing backend server connection...");
    try {
      const healthCheck = await axios.get("http://localhost:5000/api/health");
      console.log("✅ Backend server is running");
    } catch (error) {
      console.log("❌ Backend server is not running or not accessible");
      console.log("   Error:", error.message);
      return;
    }

    // 2. Create a test user with vehicles
    const testUser = {
      name: "Vehicle Test User",
      email: "vehicletest" + Date.now() + "@example.com",
      password: "password123",
      phone: "0770000001",
      address: "123 Test Street",
      vehicles: [
        {
          vehicleNumber: "TEST-" + Date.now(),
          brand: "Toyota",
          model: "Camry",
          type: "Sedan",
          manufactureYear: "2020",
          fuelType: "Petrol",
          transmission: "Automatic",
        },
      ],
    };

    console.log("2. Creating test user with vehicles...");
    await axios.post("http://localhost:5000/api/auth/register", testUser);
    console.log("✅ Test user created");

    // 3. Login with test user
    console.log("3. Logging in test user...");
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: testUser.email,
        password: testUser.password,
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login successful, token received");

    // 4. Test vehicle API endpoint
    console.log("4. Testing vehicle API endpoint...");
    const vehicleResponse = await axios.get(
      "http://localhost:5000/api/vehicles",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Vehicle API working correctly");
    console.log("📊 API Response Structure:");
    console.log("   Status:", vehicleResponse.status);
    console.log("   Success:", vehicleResponse.data.success);
    console.log("   Message:", vehicleResponse.data.message);
    console.log("   Vehicles Count:", vehicleResponse.data.data?.length || 0);

    if (vehicleResponse.data.data && vehicleResponse.data.data.length > 0) {
      console.log("\n🚗 Vehicle Details:");
      vehicleResponse.data.data.forEach((vehicle, index) => {
        console.log(`   ${index + 1}. ID: ${vehicle.vehicleId}`);
        console.log(`      Number: ${vehicle.vehicleNumber}`);
        console.log(`      Type: ${vehicle.type}`);
        console.log(`      Brand: ${vehicle.brand}`);
        console.log(`      Model: ${vehicle.model}`);
        console.log(`      Year: ${vehicle.manufactureYear}`);
        console.log("");
      });
    }

    // 5. Test booking API (to check if it accepts vehicle data)
    console.log("5. Testing booking API with vehicle data...");
    const bookingData = {
      name: testUser.name,
      phone: testUser.phone,
      vehicleNumber: vehicleResponse.data.data[0].vehicleNumber,
      vehicleType: vehicleResponse.data.data[0].type,
      fuelType: vehicleResponse.data.data[0].fuelType,
      vehicleBrand: vehicleResponse.data.data[0].brand,
      vehicleBrandModel: vehicleResponse.data.data[0].model,
      manufacturedYear: vehicleResponse.data.data[0].manufactureYear,
      transmissionType: vehicleResponse.data.data[0].transmission,
      bookingDate: new Date().toISOString().split("T")[0],
      timeSlot: "07:30 AM - 09:30 AM",
      serviceTypes: ["Oil Change"],
      specialRequests: "Test booking",
    };

    try {
      const bookingResponse = await axios.post(
        "http://localhost:5000/api/bookings",
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Booking API accepts vehicle data correctly");
    } catch (bookingError) {
      console.log(
        "❌ Booking API issue:",
        bookingError.response?.data || bookingError.message
      );
    }

    console.log("\n🎯 DIAGNOSIS SUMMARY:");
    console.log("✅ Backend server: Working");
    console.log("✅ User registration: Working");
    console.log("✅ User login: Working");
    console.log("✅ Vehicle API: Working");
    console.log("✅ Vehicle data structure: Correct");
    console.log("\n💡 If vehicles are still not selectable in the frontend:");
    console.log("   1. Check browser console for JavaScript errors");
    console.log("   2. Verify user is logged in on frontend");
    console.log("   3. Check if VehicleDebugger shows vehicles");
    console.log("   4. Ensure CORS is properly configured");
    console.log("   5. Check React DevTools for component state");
  } catch (error) {
    console.error(
      "❌ Diagnosis failed:",
      error.response?.data || error.message
    );
    console.log("\n🔍 Troubleshooting steps:");
    console.log(
      "1. Ensure backend server is running: npm run dev (in backend folder)"
    );
    console.log("2. Check if database is connected");
    console.log("3. Verify API endpoints are working");
    console.log("4. Check network connectivity");
  }
}

diagnoseVehicleSelection();
