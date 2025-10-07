// Test Vehicle API Connection
const testAPI = async () => {
  const API_BASE_URL = "http://localhost:5000/api";

  try {
    // Test 1: Basic health check
    console.log("1. Testing health check...");
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log("Health check result:", healthData);

    // Test 2: Try to get vehicles (should fail without auth)
    console.log("\n2. Testing vehicles endpoint without auth...");
    try {
      const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles`);
      console.log("Vehicles response status:", vehicleResponse.status);
      const vehicleData = await vehicleResponse.json();
      console.log("Vehicles response:", vehicleData);
    } catch (err) {
      console.log("Expected error without auth:", err.message);
    }

    // Test 3: Try with test token
    console.log("\n3. Testing vehicles endpoint with mock auth...");
    try {
      const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles`, {
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      });
      console.log(
        "Vehicles with auth response status:",
        vehicleResponse.status
      );
      const vehicleData = await vehicleResponse.json();
      console.log("Vehicles with auth response:", vehicleData);
    } catch (err) {
      console.log("Auth error:", err.message);
    }
  } catch (error) {
    console.error("API Test failed:", error);
  }
};

testAPI();
