// test_vehicle_api.js
// Test vehicle API endpoints

const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";

// Use the token from our previous registration
const TEST_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjozLCJlbWFpbCI6InRlc3QxNzU5ODU0MDYxMTUwQGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTc1OTg1NDA2MSwiZXhwIjoxNzU5OTQwNDYxfQ.qZeugRdNn9PxFLCLYaxFJ1dOqNbGFTryfnjDDdSWYI8";

async function testVehicleAPI() {
  try {
    console.log("Testing Vehicle API endpoints...");

    // Test GET /api/vehicles
    console.log("\n1. Testing GET /api/vehicles...");
    const getResponse = await axios.get(`${API_BASE_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });

    console.log("✅ GET vehicles successful!");
    console.log(`Found ${getResponse.data.data.length} vehicles:`);
    getResponse.data.data.forEach((vehicle) => {
      console.log(
        `  - ${vehicle.vehicleNumber} (${vehicle.brand} ${vehicle.model})`
      );
    });

    // Test POST /api/vehicles (add a new vehicle)
    console.log("\n2. Testing POST /api/vehicles...");
    const newVehicle = {
      vehicleNumber: `API-TEST-${Date.now()}`,
      brand: "honda",
      model: "Civic",
      type: "sedan",
      manufactureYear: 2019,
      fuelType: "petrol",
      transmission: "manual",
    };

    const postResponse = await axios.post(
      `${API_BASE_URL}/vehicles`,
      newVehicle,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );

    console.log("✅ POST vehicle successful!");
    console.log("New vehicle created:", postResponse.data.data);

    const newVehicleId = postResponse.data.data.vehicleId;

    // Test GET /api/vehicles/:id
    console.log("\n3. Testing GET /api/vehicles/:id...");
    const getByIdResponse = await axios.get(
      `${API_BASE_URL}/vehicles/${newVehicleId}`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    );

    console.log("✅ GET vehicle by ID successful!");
    console.log("Vehicle details:", getByIdResponse.data.data);

    console.log(
      "\n🎉 All Vehicle API tests passed! Vehicle data storage is working correctly."
    );
  } catch (error) {
    console.error(
      "❌ Vehicle API test failed:",
      error.response?.data || error.message
    );
  }
}

testVehicleAPI();
