const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testEshopAPI() {
  try {
    console.log("Testing GET /api/eshop...");
    const getResponse = await axios.get(`${BASE_URL}/eshop`);
    console.log("GET success:", getResponse.data.data.length, "items");

    console.log("\nTesting POST /api/eshop...");
    const newItem = {
      itemCode: "TEST001",
      itemName: "Test Item",
      description: "Test description",
      price: 100.0,
      quantity: 10,
      discountPercentage: 0,
      itemBrand: "Toyota",
      itemType: "Engine Parts",
    };
    const postResponse = await axios.post(`${BASE_URL}/eshop`, newItem);
    console.log("POST success:", postResponse.data);

    console.log("\nTesting DELETE /api/eshop/:id...");
    const itemId = postResponse.data.data.itemId;
    const deleteResponse = await axios.delete(`${BASE_URL}/eshop/${itemId}`);
    console.log("DELETE success:", deleteResponse.data);
  } catch (error) {
    console.error(
      "API test failed:",
      error.response ? error.response.data : error.message
    );
  }
}

testEshopAPI();
