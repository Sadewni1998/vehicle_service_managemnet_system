// controllers/authController.js

const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { isTenDigitPhone } = require("../utils/validators");
const sendEmail = require("../utils/emailService");
const crypto = require("crypto");

/**
 * Handles new customer registration with mandatory vehicle details.
 * Uses a database transaction to ensure data integrity.
 */
const register = async (req, res) => {
  // Destructure all possible fields from the request body
  // 'vehicles' is now required and must contain at least one complete vehicle.
  const { name, email, password, phone, address, vehicles } = req.body;

  // Basic validation for required customer fields
  if (!name || !email || !password || !phone) {
    return res
      .status(400)
      .json({ message: "Name, email, password, and phone are required." });
  }

  // Phone validation (if provided)
  if (!isTenDigitPhone(phone)) {
    return res
      .status(400)
      .json({ message: "Phone number must be exactly 10 digits." });
  }

  // Validate that vehicle information is provided
  if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
    return res.status(400).json({
      message: "At least one vehicle information is required for registration.",
    });
  }

  // Validate each vehicle has all required fields
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const requiredFields = [
      "vehicleNumber",
      "brand",
      "model",
      "type",
      "manufactureYear",
      "fuelType",
      "transmission",
    ];

    for (const field of requiredFields) {
      if (!vehicle[field] || vehicle[field] === "") {
        return res
          .status(400)
          .json({ message: `Vehicle ${i + 1}: ${field} is required.` });
      }
    }

    // Validate vehicle number format (basic validation)
    if (!/^[A-Z0-9\-]+$/i.test(vehicle.vehicleNumber)) {
      return res
        .status(400)
        .json({ message: `Vehicle ${i + 1}: Invalid vehicle number format.` });
    }

    // Validate manufacture year
    const currentYear = new Date().getFullYear();
    const year = parseInt(vehicle.manufactureYear);
    if (year < 1990 || year > currentYear) {
      return res.status(400).json({
        message: `Vehicle ${
          i + 1
        }: Manufacture year must be between 1990 and ${currentYear}.`,
      });
    }
  }

  // Get a connection from the pool to manage the transaction
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction(); // Start the transaction

    // 1. Check if a customer with the same email already exists
    const [existingUser] = await connection.query(
      "SELECT email FROM customer WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      await connection.rollback(); // Abort the transaction
      connection.release();
      return res.status(409).json({ message: "Email is already registered." });
    }

    // 2. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert the new customer into the 'customer' table
    const customerSql =
      "INSERT INTO customer (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)";
    const [customerResult] = await connection.query(customerSql, [
      name,
      email,
      hashedPassword,
      phone,
      address,
    ]);
    const newCustomerId = customerResult.insertId; // Get the ID of the new customer

    // 4. Insert vehicle data (now required)
    // Loop through each vehicle object sent from the frontend
    for (const vehicle of vehicles) {
      const {
        vehicleNumber,
        brand,
        model,
        type,
        manufactureYear,
        fuelType,
        transmission,
      } = vehicle;

      // Convert vehicle number to uppercase
      const upperCaseVehicleNumber = vehicleNumber?.toUpperCase();

      // Check if vehicle number already exists
      const [existingVehicle] = await connection.query(
        "SELECT vehicleNumber FROM vehicle WHERE vehicleNumber = ?",
        [upperCaseVehicleNumber]
      );

      if (existingVehicle.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({
          message: `Vehicle number ${upperCaseVehicleNumber} is already registered.`,
        });
      }

      // Insert each vehicle into the 'vehicle' table, linking it to the new customer
      const vehicleSql =
        "INSERT INTO vehicle (customerId, vehicleNumber, brand, model, type, manufactureYear, fuelType, transmission) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      await connection.query(vehicleSql, [
        newCustomerId,
        upperCaseVehicleNumber,
        brand,
        model,
        type,
        manufactureYear,
        fuelType,
        transmission,
      ]);
    }

    // If everything was successful, commit the transaction to save all changes
    await connection.commit();

    // Create JWT token for the new user
    const payload = {
      customerId: newCustomerId,
      email: email,
      name: name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "Customer registered successfully!",
      token: token,
      user: {
        id: newCustomerId,
        name: name,
        email: email,
        phone: phone,
        address: address,
      },
    });
  } catch (error) {
    // If any error occurred during the process, roll back all changes
    if (connection) {
      await connection.rollback();
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  } finally {
    // VERY IMPORTANT: Always release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Handles customer login.
 * Authenticates user and returns a JWT if successful.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // Find the customer by email
    const [rows] = await db.query("SELECT * FROM customer WHERE email = ?", [
      email,
    ]);
    const customer = rows[0];

    // If no customer is found, send an error response
    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials." }); // Use a generic message for security
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // If credentials are correct, create a JWT
    const payload = {
      customerId: customer.customerId,
      email: customer.email,
      name: customer.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    }); // Token expires in 24 hours

    // Send the token and user data back to the client
    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: {
        id: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const customerId = req.user.customerId;

    const [rows] = await db.query(
      "SELECT * FROM customer WHERE customerId = ?",
      [customerId]
    );
    const customer = rows[0];

    if (!customer) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const { name, phone, address } = req.body;

    if (phone && !isTenDigitPhone(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits." });
    }

    const [result] = await db.query(
      "UPDATE customer SET name = ?, phone = ?, address = ? WHERE customerId = ?",
      [name, phone, address, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const { currentPassword, newPassword } = req.body;

    // Get current password
    const [rows] = await db.query(
      "SELECT password FROM customer WHERE customerId = ?",
      [customerId]
    );
    const customer = rows[0];

    if (!customer) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query("UPDATE customer SET password = ? WHERE customerId = ?", [
      hashedPassword,
      customerId,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Handles Sign-In with Google.
 * Verifies the Google token, then finds or creates a user in our database.
 */
const googleSignIn = async (req, res) => {
  const { token } = req.body; // This is the user info from the frontend

  // Debug: Check if Google Client ID is loaded
  console.log("Google Client ID from env:", process.env.GOOGLE_CLIENT_ID);
  console.log("Received token:", token ? "Token received" : "No token");

  if (!token) {
    return res.status(400).json({ message: "Google token is required." });
  }

  try {
    // Parse the user info from frontend
    let userInfo;
    try {
      userInfo = JSON.parse(token);
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid token format." });
    }

    const { access_token } = userInfo;

    // Verify the access token with Google
    if (!access_token) {
      return res
        .status(400)
        .json({ message: "Access token is required for verification." });
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
      );
      const verifiedUserInfo = await response.json();

      if (verifiedUserInfo.error) {
        return res
          .status(400)
          .json({ message: "Invalid Google access token." });
      }

      // Use verified data from Google
      const verifiedGoogleId = verifiedUserInfo.id;
      const verifiedName = verifiedUserInfo.name;
      const verifiedEmail = verifiedUserInfo.email;

      // 4. CHECK IF USER EXISTS IN OUR DATABASE
      const [rows] = await db.query("SELECT * FROM customer WHERE email = ?", [
        verifiedEmail,
      ]);
      let customer = rows[0];

      // 5. IF USER DOES NOT EXIST, CREATE A NEW ONE
      if (!customer) {
        const newUserSql = `
          INSERT INTO customer (name, email, googleId, provider) 
          VALUES (?, ?, ?, 'google')
        `;
        const [result] = await db.query(newUserSql, [
          verifiedName,
          verifiedEmail,
          verifiedGoogleId,
        ]);

        // Fetch the newly created customer to get their customerId
        const [newRows] = await db.query(
          "SELECT * FROM customer WHERE customerId = ?",
          [result.insertId]
        );
        customer = newRows[0];
      }

      // Security Check: If a user exists but signed up locally, you might want to handle this
      if (customer.provider === "local") {
        // You could return an error, or link the Google account.
        // For now, we'll proceed, but this is a point for future improvement.
      }

      // 6. CREATE *OUR* JWT FOR THE USER
      const appTokenPayload = {
        customerId: customer.customerId,
        email: customer.email,
        name: customer.name,
      };

      const appToken = jwt.sign(appTokenPayload, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      // 7. SEND OUR TOKEN BACK TO THE FRONTEND
      res.status(200).json({
        message: "Google Sign-In successful!",
        token: appToken,
        user: {
          id: customer.customerId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
      });
    } catch (fetchError) {
      console.error("Error verifying with Google:", fetchError);
      res
        .status(400)
        .json({ message: "Failed to verify Google access token." });
    }
  } catch (error) {
    console.error("Google Sign-In error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Return more specific error message
    if (error.message.includes("Invalid token")) {
      res.status(400).json({ message: "Invalid Google token provided." });
    } else if (error.message.includes("Client ID")) {
      res.status(500).json({
        message:
          "Google OAuth configuration error. Please check Google Client ID.",
      });
    } else {
      res.status(500).json({
        message: "Server error during Google Sign-In.",
        error: error.message,
      });
    }
  }
};

/**
 * Get customer statistics
 * @route GET /api/auth/stats
 * @access Public or Protected (based on requirements)
 */
const getCustomerStats = async (req, res) => {
  try {
    // Get total number of customers
    const [countResult] = await db.query(
      "SELECT COUNT(*) as totalCustomers FROM customer"
    );

    const totalCustomers = countResult[0].totalCustomers;

    res.json({
      success: true,
      data: {
        totalCustomers,
      },
    });
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer statistics",
      error: error.message,
    });
  }
};

/**
 * Get all customers
 * @route GET /api/auth/customers
 * @access Protected (Manager only)
 */
const getAllCustomers = async (req, res) => {
  try {
    const [customers] = await db.query(
      "SELECT customerId, name, email, phone, address, createdAt FROM customer ORDER BY createdAt DESC"
    );

    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
      error: error.message,
    });
  }
};

/**
 * Forgot Password
 * Generates a temporary password and sends it to the user's email.
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Check if user exists
    const [rows] = await db.query("SELECT * FROM customer WHERE email = ?", [
      email,
    ]);
    const customer = rows[0];

    if (!customer) {
      // For security, don't reveal if user exists
      return res.status(200).json({
        message:
          "If an account exists for this email, a temporary password has been sent.",
      });
    }

    // Generate temporary password (8 characters)
    const tempPassword = crypto.randomBytes(4).toString("hex");

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update password in DB
    await db.query("UPDATE customer SET password = ? WHERE customerId = ?", [
      hashedPassword,
      customer.customerId,
    ]);

    // Send email
    const subject = "Temporary Password - Hybrid Lanka";
    const text = `Your temporary password is: ${tempPassword}\n\nPlease log in and change your password immediately.`;

    await sendEmail(email, subject, text);

    res.status(200).json({
      message:
        "If an account exists for this email, a temporary password has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  googleSignIn,
  getCustomerStats,
  getAllCustomers,
  forgotPassword,
};
