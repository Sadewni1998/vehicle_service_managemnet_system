// Test uppercase vehicle number functionality
const testUppercaseVehicle = async () => {
  const API_BASE_URL = "http://localhost:5000/api";

  // Use the real JWT token from our test user
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjozLCJlbWFpbCI6InRlc3QxNzU5ODU0MDYxMTUwQGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTc1OTg1NjEwMSwiZXhwIjoxNzU5OTQyNTAxfQ.IfC62EFGwu7jj05K6Qv-gb_oOfWWpfuMFhmzUZJiC7k";

  try {
    console.log("Testing uppercase vehicle number conversion...");

    // Add a vehicle with lowercase vehicle number
    const vehicleData = {
      vehicleNumber: "xyz-456-test" + Date.now(), // lowercase input with timestamp
      brand: "Ford",
      model: "Focus",
      type: "hatchback",
      manufactureYear: 2019,
      fuelType: "petrol",
      transmission: "manual",
    };

    console.log(
      "1. Adding vehicle with lowercase number:",
      vehicleData.vehicleNumber
    );

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
      console.log("✅ Vehicle added successfully!");
      console.log("Vehicle number in database:", addResult.data.vehicleNumber);

      if (addResult.data.vehicleNumber === "ABC-123-LOWERCASE") {
        console.log("✅ Vehicle number correctly converted to uppercase!");
      } else {
        console.log("❌ Vehicle number not converted to uppercase");
      }

      // Get all vehicles to verify
      console.log("\n2. Getting all vehicles to verify storage...");
      const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const vehicleList = await vehicleResponse.json();
      console.log("All vehicles:", vehicleList.data);

      // Find our test vehicle
      const testVehicle = vehicleList.data.find(
        (v) => v.vehicleNumber === "ABC-123-LOWERCASE"
      );
      if (testVehicle) {
        console.log(
          "✅ Found test vehicle with uppercase number:",
          testVehicle.vehicleNumber
        );
      }
    } else {
      console.log("❌ Failed to add vehicle:", addResult);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

testUppercaseVehicle();
