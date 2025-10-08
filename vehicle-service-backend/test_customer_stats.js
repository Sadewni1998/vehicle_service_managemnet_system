// Test script for customer stats endpoint
const http = require("http");

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/auth/stats",
  method: "GET",
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:", data);
  });
});

req.on("error", (error) => {
  console.error("Error:", error);
});

req.end();
