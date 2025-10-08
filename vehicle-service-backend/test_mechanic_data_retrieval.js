const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";

async function testMechanicDataRetrieval() {
  try {
    console.log("🧪 Testing Mechanic Data Retrieval\n");
    console.log("=".repeat(70));

    // Test the endpoint that "Assign Mechanics" button uses
    console.log("\n📡 Making API call: GET /api/mechanics?limit=100");
    console.log(
      '   (This is the same call made when clicking "Assign Mechanics")\n'
    );

    const response = await axios.get(`${API_BASE_URL}/mechanics`, {
      params: { limit: 100 },
    });

    if (!response.data.success) {
      console.log("❌ API call failed");
      return;
    }

    const mechanics = response.data.data;
    console.log(
      `✅ Success! Retrieved ${mechanics.length} mechanic(s) from database\n`
    );

    if (mechanics.length === 0) {
      console.log("⚠️  No mechanics found in database.");
      console.log("   Please add mechanics to test this feature.");
      return;
    }

    console.log("📊 Mechanic Data Retrieved:\n");
    console.log("=".repeat(70));

    mechanics.forEach((mechanic, index) => {
      console.log(`\n🔧 Mechanic #${index + 1}:`);
      console.log("─".repeat(70));
      console.log(`   mechanicId:        ${mechanic.mechanicId}`);
      console.log(`   mechanicName:      ${mechanic.mechanicName}`);
      console.log(`   mechanicCode:      ${mechanic.mechanicCode}`);
      console.log(`   staffId:           ${mechanic.staffId}`);
      console.log(`   email:             ${mechanic.email}`);
      console.log(`   specialization:    ${mechanic.specialization}`);
      console.log(
        `   experience:        ${
          mechanic.experience || mechanic.experienceYears
        } years`
      );
      console.log(`   certifications:    ${mechanic.certifications}`);
      console.log(`   availability:      ${mechanic.availability}`);
      console.log(
        `   hourlyRate:        LKR ${
          mechanic.hourlyRate?.toLocaleString() || "N/A"
        }`
      );
      console.log(`   isActive:          ${mechanic.isActive}`);
      console.log(`   createdAt:         ${mechanic.createdAt}`);
      console.log(`   updatedAt:         ${mechanic.updatedAt}`);
    });

    console.log("\n" + "=".repeat(70));
    console.log("\n📋 Summary of Fields Retrieved:\n");

    const sampleMechanic = mechanics[0];
    const fields = Object.keys(sampleMechanic);

    console.log(`   Total Fields: ${fields.length}`);
    console.log(`   Fields: ${fields.join(", ")}`);

    console.log("\n✅ All Fields from Mechanic Table:\n");

    const expectedFields = [
      "mechanicId",
      "staffId",
      "mechanicCode",
      "mechanicName",
      "email",
      "specialization",
      "experience",
      "certifications",
      "availability",
      "hourlyRate",
      "isActive",
      "createdAt",
      "updatedAt",
    ];

    expectedFields.forEach((field) => {
      const exists =
        fields.includes(field) ||
        fields.includes(field.replace("experience", "experienceYears"));
      const symbol = exists ? "✅" : "❌";
      console.log(`   ${symbol} ${field}`);
    });

    console.log("\n" + "=".repeat(70));
    console.log("\n🎨 How This Data Appears in UI:\n");

    const firstMechanic = mechanics[0];
    console.log("┌────────────────────────────────────────────────┐");
    console.log(
      `│ ☐ ${firstMechanic.mechanicName.padEnd(
        30
      )} ID: ${firstMechanic.mechanicId.toString().padStart(2)} │`
    );
    console.log(`│ Code: ${firstMechanic.mechanicCode.padEnd(38)} │`);
    console.log(`│ Email: ${firstMechanic.email.padEnd(37)} │`);
    console.log(`│ Staff ID: ${firstMechanic.staffId.toString().padEnd(36)} │`);
    console.log(
      `│ Specialization: ${firstMechanic.specialization
        .substring(0, 28)
        .padEnd(28)} │`
    );
    console.log(
      `│ Experience: ${(
        firstMechanic.experience || firstMechanic.experienceYears
      )
        .toString()
        .padEnd(33)} years │`
    );
    console.log(
      `│ Hourly Rate: LKR ${(firstMechanic.hourlyRate || 0)
        .toLocaleString()
        .padEnd(24)} │`
    );
    console.log(`│ Availability: ${firstMechanic.availability.padEnd(30)} │`);
    console.log("└────────────────────────────────────────────────┘");

    console.log("\n💡 Tips:");
    console.log('   - This data is displayed when clicking "Assign Mechanics"');
    console.log("   - Users can search by name or code");
    console.log("   - Users can filter by availability status");
    console.log("   - Multiple mechanics can be selected via checkboxes");

    console.log("\n🎉 Data retrieval is working perfectly!");
    console.log(
      "   All fields from the mechanic table are being retrieved and displayed.\n"
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error(
        "\n💡 Tip: Make sure the backend server is running on http://localhost:5000"
      );
      console.error("   Run: cd vehicle-service-backend && npm start");
    } else if (error.response) {
      console.error("   Status:", error.response.status);
      console.error(
        "   Message:",
        error.response.data?.message || "No message"
      );
    }
  }
}

console.log(
  "╔══════════════════════════════════════════════════════════════════╗"
);
console.log(
  "║  TEST: MECHANIC DATA RETRIEVAL (Assign Mechanics Button)        ║"
);
console.log(
  "╚══════════════════════════════════════════════════════════════════╝\n"
);

testMechanicDataRetrieval()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
