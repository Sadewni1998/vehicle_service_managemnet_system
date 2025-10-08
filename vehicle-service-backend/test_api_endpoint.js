const axios = require("axios");

async function testAPI() {
  try {
    console.log(
      "🔍 Testing API endpoint: http://localhost:5000/api/bookings/today\n"
    );

    const response = await axios.get(
      "http://localhost:5000/api/bookings/today"
    );

    console.log("✅ API Response Status:", response.status);
    console.log("📊 Number of bookings returned:", response.data.length);
    console.log("\n📋 Booking Data:\n");
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.length === 0) {
      console.log("\n⚠️  No bookings returned from API for today (2025-10-08)");
      console.log(
        '   This means the frontend will show "No vehicles found matching your criteria"'
      );
    } else {
      console.log(
        "\n✅ Bookings will be displayed in the Receptionist Dashboard!"
      );
      response.data.forEach((booking, index) => {
        console.log(
          `\n${index + 1}. ${booking.vehicleNumber} - ${booking.customer}`
        );
        console.log(`   Status: ${booking.status}`);
        console.log(`   Time: ${booking.timeSlot}`);
      });
    }
  } catch (error) {
    console.error("❌ API Error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("   → Backend server is not running on port 5000");
      console.error(
        "   → Start it with: cd vehicle-service-backend && npm run dev"
      );
    }
  }
}

testAPI();
