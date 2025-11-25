import axios from "axios";

async function testEshopAPI() {
  try {
    console.log("Testing GET /api/eshop...");
    const response = await axios.get("http://localhost:5000/api/eshop");
    console.log("Success! Items count:", response.data.data.length);
    console.log("First item:", response.data.data[0]);

    // Test POST
    console.log("\nTesting POST /api/eshop...");
    const newItem = {
      itemCode: "TEST001",
      itemName: "Test Item",
      description: "Test description",
      price: 100,
      quantity: 10,
      discountPercentage: 5,
      itemBrand: "Toyota",
      itemType: "Filters",
    };

    const postResponse = await axios.post(
      "http://localhost:5000/api/eshop",
      newItem
    );
    console.log("POST success! Created item:", postResponse.data.data);

    // Test DELETE
    console.log("\nTesting DELETE /api/eshop...");
    const deleteResponse = await axios.delete(
      `http://localhost:5000/api/eshop/${postResponse.data.data.itemId}`
    );
    console.log("DELETE success!");
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testEshopAPI();
