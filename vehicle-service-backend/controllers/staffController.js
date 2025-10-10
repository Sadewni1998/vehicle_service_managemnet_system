// controllers/staffController.js

const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Creates a new staff member account (e.g., receptionist).
 * In a real application, this should only be accessible by a manager/admin.
 */
const registerStaff = async (req, res) => {
  const { name, email, role, mechanicDetails } = req.body;

  if (!name || !email || !role) {
    return res
      .status(400)
      .json({ message: "Name, email, and role are required." });
  }

  // Validate role
  const validRoles = ['receptionist', 'mechanic', 'service_advisor'];
  if (!validRoles.includes(role)) {
    return res
      .status(400)
      .json({ message: "Invalid role. Must be one of: receptionist, mechanic, service_advisor." });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Check if staff already exists
    const [existingStaff] = await conn.query(
      "SELECT email FROM staff WHERE email = ?",
      [email]
    );
    if (existingStaff.length > 0) {
      await conn.rollback();
      return res
        .status(409)
        .json({ message: "A staff member with this email already exists." });
    }

    // Check role availability for receptionist and service_advisor
    if (role === 'receptionist' || role === 'service_advisor') {
      const [existingRole] = await conn.query(
        "SELECT COUNT(*) as count FROM staff WHERE role = ?",
        [role]
      );
      if (existingRole[0].count > 0) {
        await conn.rollback();
        return res
          .status(409)
          .json({ message: `${role} role is already taken. Only one ${role} is allowed.` });
      }
    }

    // Generate auto password
    const autoPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(autoPassword, salt);

    // Create staff record
    const insertStaffSql =
      "INSERT INTO staff (name, email, password, role) VALUES (?, ?, ?, ?)";
    const [staffResult] = await conn.query(insertStaffSql, [
      name,
      email,
      hashedPassword,
      role,
    ]);

    const staffId = staffResult.insertId;

    // If the role is mechanic, also create a mechanic record linked to this staff
    let mechanicRecord = null;
    if (role === "mechanic") {
      // Generate next mechanic code (MEC###)
      const [maxCodeResult] = await conn.execute(
        'SELECT MAX(CAST(SUBSTRING(mechanicCode, 4) AS UNSIGNED)) as maxNum FROM mechanic WHERE mechanicCode LIKE "MEC%"'
      );
      const nextNum = (maxCodeResult[0].maxNum || 0) + 1;
      const mechanicCode = `MEC${nextNum.toString().padStart(3, "0")}`;

      // Prepare mechanic details (fallbacks to sensible defaults)
      const specialization = mechanicDetails?.specialization || null;
      const experienceYears = mechanicDetails?.experienceYears ?? 0;
      const certifications = mechanicDetails?.certifications || null; // can be JSON string
      const hourlyRate = mechanicDetails?.hourlyRate ?? null;
      const mechanicName = mechanicDetails?.mechanicName || name;

      const insertMechanicSql =
        "INSERT INTO mechanic (staffId, mechanicCode, mechanicName, specialization, experienceYears, certifications, availability, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, 'Available', ?)";

      const [mechResult] = await conn.query(insertMechanicSql, [
        staffId,
        mechanicCode,
        mechanicName,
        specialization,
        experienceYears,
        certifications,
        hourlyRate,
      ]);

      // Fetch the created mechanic via the view for response consistency
      const [mechanicRows] = await conn.query(
        "SELECT * FROM mechanic_details WHERE mechanicId = ?",
        [mechResult.insertId]
      );
      mechanicRecord = mechanicRows[0] || null;
    }

    await conn.commit();

    res.status(201).json({
      message:
        role === "mechanic"
          ? "Mechanic and staff account created successfully!"
          : "Staff member created successfully!",
      staffId,
      mechanic: mechanicRecord,
      autoPassword: autoPassword, // Return the auto-generated password
    });
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }
    console.error("Staff registration error:", error);
    res
      .status(500)
      .json({ message: "Server error during staff registration." });
  } finally {
    if (conn) conn.release();
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
 * Get all staff members
 */
const getAllStaff = async (req, res) => {
  try {
    const [staff] = await db.query(`
      SELECT 
        s.staffId,
        s.name,
        s.email,
        s.role,
        s.createdAt,
        s.updatedAt,
        m.mechanicId,
        m.mechanicCode,
        m.specialization,
        m.experienceYears,
        m.availability,
        m.hourlyRate
      FROM staff s
      LEFT JOIN mechanic m ON s.staffId = m.staffId
      ORDER BY s.createdAt DESC
    `);

    res.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ message: "Server error fetching staff." });
  }
};

/**
 * Check if a role is already taken (for receptionist and service_advisor)
 */
const checkRoleAvailability = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['receptionist', 'service_advisor'].includes(role)) {
      return res.status(400).json({ message: "Invalid role for availability check." });
    }

    const [existing] = await db.query(
      "SELECT COUNT(*) as count FROM staff WHERE role = ?",
      [role]
    );

    const isAvailable = existing[0].count === 0;
    
    res.json({
      role,
      isAvailable,
      message: isAvailable 
        ? `${role} role is available` 
        : `${role} role is already taken`
    });
  } catch (error) {
    console.error("Error checking role availability:", error);
    res.status(500).json({ message: "Server error checking role availability." });
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
  getAllStaff,
  checkRoleAvailability,
  getStaffStats,
};
