// Test Vehicle Delete Functionality
const testVehicleDelete = async () => {
  const API_BASE_URL = "http://localhost:5000/api";

  // Use the real JWT token from our test user
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjozLCJlbWFpbCI6InRlc3QxNzU5ODU0MDYxMTUwQGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTc1OTg1NjEwMSwiZXhwIjoxNzU5OTQyNTAxfQ.IfC62EFGwu7jj05K6Qv-gb_oOfWWpfuMFhmzUZJiC7k";

  try {
    // First, get all vehicles to see what we have
    console.log("1. Getting current vehicles...");
    const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const vehicleData = await vehicleResponse.json();
    console.log("Current vehicles:", vehicleData);

    if (vehicleData.data && vehicleData.data.length > 1) {
      // Try to delete the first vehicle (we need at least one vehicle to remain)
      const vehicleToDelete = vehicleData.data[0];
      console.log(
        `\n2. Attempting to delete vehicle: ${vehicleToDelete.vehicleNumber} (ID: ${vehicleToDelete.vehicleId})`
      );

      const deleteResponse = await fetch(
        `${API_BASE_URL}/vehicles/${vehicleToDelete.vehicleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const deleteResult = await deleteResponse.json();
      console.log("Delete response status:", deleteResponse.status);
      console.log("Delete response:", deleteResult);

      if (deleteResponse.status === 200) {
        console.log("✅ Vehicle deleted successfully!");

        // Verify deletion by getting vehicles again
        console.log("\n3. Verifying deletion...");
        const verifyResponse = await fetch(`${API_BASE_URL}/vehicles`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const verifyData = await verifyResponse.json();
        console.log("Vehicles after deletion:", verifyData);
      } else {
        console.log("❌ Delete failed:", deleteResult);
      }
    } else {
      console.log(
        "⚠️ Not enough vehicles to safely test deletion (need at least 2)"
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

testVehicleDelete();
