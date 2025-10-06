// index.js

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load environment variables from .env file

const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const breakdownRoutes = require("./routes/breakdownRoutes");
const contactRoutes = require("./routes/contactRoutes");
const staffRoutes = require("./routes/staffRoutes");
const sparepartsRoutes = require("./routes/sparepartsRoutes");
const mechanicRoutes = require("./routes/mechanicRoutes");
// Initialize the Express app
const app = express();

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5173"
    ],
    credentials: true,
  })
);

// Middleware to parse JSON request bodies
app.use(express.json());

// Define a base route for health checks
app.get("/", (req, res) => {
  res.send("Vehicle Service Management System API is running!");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});

// Use the authentication routes with a base path of /api/auth
app.use("/api/auth", authRoutes);

app.use("/api/bookings", bookingRoutes);
app.use("/api/breakdown", breakdownRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/spareparts", sparepartsRoutes);
app.use("/api/mechanics", mechanicRoutes);

// Placeholder routes for frontend compatibility
app.get("/api/users/services", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Oil Change",
      description: "Regular oil change service",
      price: 50,
    },
    {
      id: 2,
      name: "Brake Service",
      description: "Brake pad replacement and maintenance",
      price: 120,
    },
    {
      id: 3,
      name: "Engine Tune-up",
      description: "Complete engine inspection and tuning",
      price: 200,
    },
    {
      id: 4,
      name: "Tire Rotation",
      description: "Tire rotation and balancing",
      price: 30,
    },
  ]);
});

// Redirect old parts endpoint to new spareparts API
app.get("/api/users/parts", (req, res) => {
  res.redirect("/api/spareparts");
});

app.get("/api/users/team", (req, res) => {
  res.json([
    {
      id: 1,
      name: "John Smith",
      position: "Senior Mechanic",
      experience: "10 years",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      position: "Engine Specialist",
      experience: "8 years",
    },
    {
      id: 3,
      name: "Mike Davis",
      position: "Brake Specialist",
      experience: "6 years",
    },
    {
      id: 4,
      name: "Lisa Wilson",
      position: "Service Manager",
      experience: "12 years",
    },
  ]);
});

app.get("/api/users/testimonials", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Robert Brown",
      rating: 5,
      comment: "Excellent service! My car runs like new.",
    },
    {
      id: 2,
      name: "Maria Garcia",
      rating: 5,
      comment: "Professional team and fair pricing.",
    },
    {
      id: 3,
      name: "David Lee",
      rating: 4,
      comment: "Quick and efficient service.",
    },
    {
      id: 4,
      name: "Jennifer Taylor",
      rating: 5,
      comment: "Highly recommend this service center.",
    },
  ]);
});

app.use("/api/contact", contactRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Get the port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
