import axios from "axios";

async function testBookingWithVehicle() {
  console.log("🧪 Testing booking submission with vehicle data...\n");

  try {
    // Register a test user with vehicles
    const testUser = {
      name: "Booking Test User",
      email: "bookingtest" + Date.now() + "@example.com",
      password: "password123",
      phone: "0770000002",
      address: "123 Booking Test Street",
      vehicles: [
        {
          vehicleNumber: "BOOKING-TEST-" + Date.now(),
          brand: "Toyota",
          model: "Corolla",
          type: "Sedan",
          manufactureYear: "2021",
          fuelType: "Petrol",
          transmission: "Manual",
        },
      ],
    };

    console.log("1. Registering test user...");
    await axios.post("http://localhost:5000/api/auth/register", testUser);
    console.log("✅ User registered successfully");

    // Login
    console.log("2. Logging in...");
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: testUser.email,
        password: testUser.password,
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login successful");

    // Get user vehicles
    console.log("3. Fetching user vehicles...");
    const vehicleResponse = await axios.get(
      "http://localhost:5000/api/vehicles",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const vehicle = vehicleResponse.data.data[0];
    console.log("✅ Vehicle fetched:", vehicle.vehicleNumber);

    // Test booking submission
    console.log("4. Creating booking...");
    const bookingData = {
      name: testUser.name,
      phone: testUser.phone,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.type,
      fuelType: vehicle.fuelType,
      vehicleBrand: vehicle.brand,
      vehicleBrandModel: vehicle.model,
      manufacturedYear: vehicle.manufactureYear,
      transmissionType: vehicle.transmission,
      bookingDate: new Date().toISOString().split("T")[0], // Today
      timeSlot: "07:30 AM - 09:30 AM",
      serviceTypes: ["Oil Change"],
      specialRequests: "Test booking",
    };

    console.log("📦 Booking data:", bookingData);

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

    console.log("✅ Booking created successfully!");
    console.log("📋 Booking response:", bookingResponse.data);
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.data) {
      console.error("📋 Detailed error:", error.response.data);
    }
  }
}

testBookingWithVehicle();
