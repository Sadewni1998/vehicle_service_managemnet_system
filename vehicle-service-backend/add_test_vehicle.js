// Add a test vehicle for deletion testing
const testAddVehicle = async () => {
  const API_BASE_URL = "http://localhost:5000/api";

  // Use the real JWT token from our test user
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjozLCJlbWFpbCI6InRlc3QxNzU5ODU0MDYxMTUwQGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTc1OTg1NjEwMSwiZXhwIjoxNzU5OTQyNTAxfQ.IfC62EFGwu7jj05K6Qv-gb_oOfWWpfuMFhmzUZJiC7k";

  try {
    console.log("Adding a test vehicle for deletion testing...");

    const vehicleData = {
      vehicleNumber: "DELETE-TEST-" + Date.now(),
      brand: "Nissan",
      model: "Sunny",
      type: "sedan",
      manufactureYear: 2018,
      fuelType: "petrol",
      transmission: "manual",
    };

    const addResponse = await fetch(`${API_BASE_URL}/vehicles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vehicleData),
    });

    const addResult = await addResponse.json();
    console.log("Add vehicle response:", addResult);

    if (addResponse.status === 201) {
      console.log("✅ Test vehicle added successfully!");

      // Now get all vehicles to see the updated list
      console.log("\nGetting updated vehicle list...");
      const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const vehicleData = await vehicleResponse.json();
      console.log("Current vehicles:", vehicleData);

      console.log("\n🎯 Now you can test deletion in the frontend!");
      console.log("Go to: http://localhost:5174/customer-dashboard");
      console.log("Navigate to the Vehicle tab and click the delete button.");
    } else {
      console.log("❌ Failed to add test vehicle:", addResult);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

testAddVehicle();
