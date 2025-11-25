const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function debugPost() {
  try {
    const newItem = {
      itemCode: "TEST002",
      itemName: "Test Item 2",
      description: "Test description",
      price: 100.0,
      quantity: 10,
      discountPercentage: 0,
      itemBrand: "Toyota",
      itemType: "Engine Parts",
    };
    console.log("Sending item:", newItem);

    const response = await axios.post(`${BASE_URL}/eshop`, newItem);
    console.log("Success:", response.data);
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    if (error.response && error.response.data.error) {
      console.error("Full error:", error.response.data.error);
    }
  }
}

debugPost();
