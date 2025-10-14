// Simple test script to verify invoice generation (ESM)
import axios from "axios";
import fs from "fs";

async function testInvoiceGeneration() {
  try {
    console.log("Testing invoice generation...");

    // You must supply a manager JWT in the environment (MANAGER_TOKEN)
    const token = process.env.MANAGER_TOKEN;
    if (!token) {
      console.warn(
        "Warning: MANAGER_TOKEN not set. This endpoint requires manager auth and will likely fail with 401."
      );
    }

    // Choose a booking ID that exists in your DB
    const bookingId = process.env.BOOKING_ID || 3;

    const response = await axios.get(
      `http://localhost:5000/api/invoices/${bookingId}/generate`,
      {
        responseType: "arraybuffer",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    console.log("Invoice generated successfully!");
    console.log("Response headers:", response.headers);
    console.log("Response size:", response.data?.byteLength ?? 0, "bytes");

    fs.writeFileSync("test_invoice.pdf", Buffer.from(response.data));
    console.log("Invoice saved as test_invoice.pdf");
  } catch (error) {
    console.error("Error testing invoice generation:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      // Attempt to decode arraybuffer error bodies
      try {
        const text = Buffer.from(error.response.data).toString("utf8");
        console.error("Response data:", text);
      } catch {
        console.error("Response data (raw):", error.response.data);
      }
    }
  }
}

testInvoiceGeneration();
