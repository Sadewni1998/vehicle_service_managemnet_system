const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function quickTest() {
  try {
    console.log("Testing GET /api/eshop...");
    const response = await axios.get(`${BASE_URL}/eshop`);
    console.log("Success! Found", response.data.data.length, "items");
    console.log("First item:", response.data.data[0]);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

quickTest();
