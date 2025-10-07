// Test login to get a real JWT token
const testLogin = async () => {
  const API_BASE_URL = "http://localhost:5000/api";

  try {
    // Test login with existing user (try different emails)
    const testCredentials = [
      { email: "jaazilmohamed@gmail.com", password: "password123" },
      { email: "jaazil@gmail.com", password: "password123" },
      { email: "test1759854061150@example.com", password: "password123" },
    ];

    for (const credentials of testCredentials) {
      console.log(`Testing login with: ${credentials.email}`);
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      console.log("Login response status:", loginResponse.status);
      const loginData = await loginResponse.json();
      console.log("Login response:", loginData);

      if (loginData.token) {
        console.log("\n✅ Login successful! Token:", loginData.token);
        console.log("User data:", loginData.user);

        // Test vehicle API with real token
        console.log("\nTesting vehicles with real token...");
        const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles`, {
          headers: {
            Authorization: `Bearer ${loginData.token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Vehicle response status:", vehicleResponse.status);
        const vehicleData = await vehicleResponse.json();
        console.log("Vehicle data:", vehicleData);
        return; // Exit after successful login
      }
      console.log("---");
    }
  } catch (error) {
    console.error("Login test failed:", error);
  }
};

testLogin();
