// controllers/staffController.js

const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Creates a new staff member account (e.g., receptionist).
 * In a real application, this should only be accessible by a manager/admin.
 */
const registerStaff = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Name, email, password, and role are required." });
  }

  try {
    const [existingStaff] = await db.query(
      "SELECT email FROM staff WHERE email = ?",
      [email]
    );
    if (existingStaff.length > 0) {
      return res
        .status(409)
        .json({ message: "A staff member with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql =
      "INSERT INTO staff (name, email, password, role) VALUES (?, ?, ?, ?)";
    const [result] = await db.query(sql, [name, email, hashedPassword, role]);

    res.status(201).json({
      message: "Staff member created successfully!",
      staffId: result.insertId,
    });
  } catch (error) {
    console.error("Staff registration error:", error);
    res
      .status(500)
      .json({ message: "Server error during staff registration." });
  }
};

/**
 * Handles staff login.
 * Authenticates staff and returns a JWT with their role.
 */
const loginStaff = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await db.query("SELECT * FROM staff WHERE email = ?", [
      email,
    ]);
    const staffMember = rows[0];

    if (!staffMember) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, staffMember.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Create a JWT payload containing the staff ID and their ROLE
    const payload = {
      staffId: staffMember.staffId,
      email: staffMember.email,
      name: staffMember.name,
      role: staffMember.role, // This is crucial for role-based access
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.status(200).json({
      message: "Login successful!",
      token: token,
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({ message: "Server error during staff login." });
  }
};

/**
 * Get staff statistics (total count, count by role, etc.)
 */
const getStaffStats = async (req, res) => {
  try {
    // Get total staff count
    const [totalStaff] = await db.query("SELECT COUNT(*) as total FROM staff");

    // Get count by role
    const [staffByRole] = await db.query(
      "SELECT role, COUNT(*) as count FROM staff GROUP BY role"
    );

    // Format the role counts into an object
    const roleBreakdown = {};
    staffByRole.forEach((row) => {
      roleBreakdown[row.role] = row.count;
    });

    res.json({
      totalStaff: totalStaff[0].total,
      byRole: roleBreakdown,
    });
  } catch (error) {
    console.error("Error fetching staff stats:", error);
    res
      .status(500)
      .json({ message: "Server error fetching staff statistics." });
  }
};

module.exports = {
  registerStaff,
  loginStaff,
  getStaffStats,
};