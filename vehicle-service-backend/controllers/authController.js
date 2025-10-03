// controllers/authController.js

const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Handles new customer registration with optional vehicle details.
 * Uses a database transaction to ensure data integrity.
 */
const register = async (req, res) => {
  // Destructure all possible fields from the request body
  // 'vehicles' is expected to be an array of vehicle objects, but it's optional.
  const { name, email, password, phone, address, vehicles } = req.body;

  // Basic validation for required customer fields
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
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

    // 4. Check if vehicle data was provided and is a non-empty array
    if (vehicles && Array.isArray(vehicles) && vehicles.length > 0) {
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

        // Insert each vehicle into the 'vehicle' table, linking it to the new customer
        const vehicleSql =
          "INSERT INTO vehicle (customerId, vehicleNumber, brand, model, type, manufactureYear, fuelType, transmission) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        await connection.query(vehicleSql, [
          newCustomerId,
          vehicleNumber,
          brand,
          model,
          type,
          manufactureYear,
          fuelType,
          transmission,
        ]);
      }
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
      expiresIn: "1h",
    });

    res.status(201).json({ 
      message: "Customer registered successfully!",
      token: token,
      user: {
        id: newCustomerId,
        name: name,
        email: email,
        phone: phone,
        address: address
      }
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
      expiresIn: "1h",
    }); // Token expires in 1 hour

    // Send the token and user data back to the client
    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: {
        id: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
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
    
    const [rows] = await db.query("SELECT * FROM customer WHERE customerId = ?", [customerId]);
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
        address: customer.address
      }
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
    const [rows] = await db.query("SELECT password FROM customer WHERE customerId = ?", [customerId]);
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
    await db.query("UPDATE customer SET password = ? WHERE customerId = ?", [hashedPassword, customerId]);
    
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
