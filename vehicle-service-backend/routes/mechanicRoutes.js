const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/mechanics - Get all mechanics with optional filtering
router.get("/", async (req, res) => {
  try {
    const { availability, specialization, page = 1, limit = 20 } = req.query;
    let query = "SELECT * FROM mechanic_details WHERE isActive = true";
    let queryParams = [];

    // Add availability filter
    if (availability) {
      query += " AND availability = ?";
      queryParams.push(availability);
    }

    // Add specialization filter
    if (specialization) {
      query += " AND specialization LIKE ?";
      queryParams.push(`%${specialization}%`);
    }

    // Add ordering
    query += " ORDER BY mechanicCode ASC";

    // Add pagination
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), offset);

    const [mechanics] = await db.execute(query, queryParams);

    // Get total count for pagination
    let countQuery =
      "SELECT COUNT(*) as total FROM mechanic_details WHERE isActive = true";
    let countParams = [];

    if (availability) {
      countQuery += " AND availability = ?";
      countParams.push(availability);
    }

    if (specialization) {
      countQuery += " AND specialization LIKE ?";
      countParams.push(`%${specialization}%`);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: mechanics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching mechanics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching mechanics",
      error: error.message,
    });
  }
});

// GET /api/mechanics/available - Get only available mechanics
router.get("/available", async (req, res) => {
  try {
    const [mechanics] = await db.execute(
      'SELECT * FROM mechanic_details WHERE isActive = true AND availability = "Available" ORDER BY mechanicCode ASC'
    );

    res.json({
      success: true,
      data: mechanics,
    });
  } catch (error) {
    console.error("Error fetching available mechanics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available mechanics",
      error: error.message,
    });
  }
});

// GET /api/mechanics/:id - Get a specific mechanic by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [mechanics] = await db.execute(
      "SELECT * FROM mechanic_details WHERE mechanicId = ? AND isActive = true",
      [id]
    );

    if (mechanics.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    res.json({
      success: true,
      data: mechanics[0],
    });
  } catch (error) {
    console.error("Error fetching mechanic:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching mechanic",
      error: error.message,
    });
  }
});

// GET /api/mechanics/staff/:staffId - Get mechanic by staff ID
router.get("/staff/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;
    const [mechanics] = await db.execute(
      "SELECT * FROM mechanic_details WHERE staffId = ? AND isActive = true",
      [staffId]
    );

    if (mechanics.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found for this staff member",
      });
    }

    res.json({
      success: true,
      data: mechanics[0],
    });
  } catch (error) {
    console.error("Error fetching mechanic by staff ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching mechanic by staff ID",
      error: error.message,
    });
  }
});

// POST /api/mechanics - Create a new mechanic from existing staff
router.post("/", async (req, res) => {
  try {
    const {
      staffId,
      specialization,
      experienceYears = 0,
      certifications,
      availability = "Available",
      hourlyRate,
    } = req.body;

    // Validate required fields
    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    // Check if staff member exists and is a mechanic
    const [staff] = await db.execute(
      'SELECT * FROM staff WHERE staffId = ? AND role = "mechanic"',
      [staffId]
    );

    if (staff.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found or not a mechanic",
      });
    }

    // Check if mechanic record already exists for this staff member
    const [existingMechanic] = await db.execute(
      "SELECT mechanicId FROM mechanic WHERE staffId = ?",
      [staffId]
    );

    if (existingMechanic.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Mechanic record already exists for this staff member",
      });
    }

    // Generate unique mechanic code
    const [maxCodeResult] = await db.execute(
      'SELECT MAX(CAST(SUBSTRING(mechanicCode, 4) AS UNSIGNED)) as maxNum FROM mechanic WHERE mechanicCode LIKE "MEC%"'
    );

    const nextNum = (maxCodeResult[0].maxNum || 0) + 1;
    const mechanicCode = `MEC${nextNum.toString().padStart(3, "0")}`;

    // Validate availability
    const validAvailability = ["Available", "Busy", "On Break", "Off Duty"];
    if (availability && !validAvailability.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status",
      });
    }

    // Insert new mechanic
    const [result] = await db.execute(
      `INSERT INTO mechanic (staffId, mechanicCode, specialization, experienceYears, certifications, availability, hourlyRate)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        staffId,
        mechanicCode,
        specialization,
        experienceYears,
        certifications,
        availability,
        hourlyRate,
      ]
    );

    // Fetch the created mechanic details
    const [newMechanic] = await db.execute(
      "SELECT * FROM mechanic_details WHERE mechanicId = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Mechanic created successfully",
      data: newMechanic[0],
    });
  } catch (error) {
    console.error("Error creating mechanic:", error);
    res.status(500).json({
      success: false,
      message: "Error creating mechanic",
      error: error.message,
    });
  }
});

// PUT /api/mechanics/:id - Update a mechanic
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      specialization,
      experienceYears,
      certifications,
      availability,
      hourlyRate,
      isActive,
    } = req.body;

    // Check if mechanic exists
    const [existingMechanic] = await db.execute(
      "SELECT * FROM mechanic WHERE mechanicId = ?",
      [id]
    );

    if (existingMechanic.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    // Validate availability if provided
    if (availability) {
      const validAvailability = ["Available", "Busy", "On Break", "Off Duty"];
      if (!validAvailability.includes(availability)) {
        return res.status(400).json({
          success: false,
          message: "Invalid availability status",
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (specialization !== undefined) {
      updateFields.push("specialization = ?");
      updateValues.push(specialization);
    }
    if (experienceYears !== undefined) {
      updateFields.push("experienceYears = ?");
      updateValues.push(experienceYears);
    }
    if (certifications !== undefined) {
      updateFields.push("certifications = ?");
      updateValues.push(certifications);
    }
    if (availability !== undefined) {
      updateFields.push("availability = ?");
      updateValues.push(availability);
    }
    if (hourlyRate !== undefined) {
      updateFields.push("hourlyRate = ?");
      updateValues.push(hourlyRate);
    }
    if (isActive !== undefined) {
      updateFields.push("isActive = ?");
      updateValues.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Add the ID to the end of the values array
    updateValues.push(id);

    // Execute update
    await db.execute(
      `UPDATE mechanic SET ${updateFields.join(", ")} WHERE mechanicId = ?`,
      updateValues
    );

    // Fetch updated mechanic
    const [updatedMechanic] = await db.execute(
      "SELECT * FROM mechanic_details WHERE mechanicId = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Mechanic updated successfully",
      data: updatedMechanic[0],
    });
  } catch (error) {
    console.error("Error updating mechanic:", error);
    res.status(500).json({
      success: false,
      message: "Error updating mechanic",
      error: error.message,
    });
  }
});

// PUT /api/mechanics/:id/availability - Update mechanic availability
router.put("/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: "Availability is required",
      });
    }

    // Validate availability
    const validAvailability = ["Available", "Busy", "On Break", "Off Duty"];
    if (!validAvailability.includes(availability)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid availability status. Must be one of: " +
          validAvailability.join(", "),
      });
    }

    // Check if mechanic exists
    const [existingMechanic] = await db.execute(
      "SELECT * FROM mechanic WHERE mechanicId = ? AND isActive = true",
      [id]
    );

    if (existingMechanic.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    // Update availability
    await db.execute(
      "UPDATE mechanic SET availability = ? WHERE mechanicId = ?",
      [availability, id]
    );

    // Fetch updated mechanic
    const [updatedMechanic] = await db.execute(
      "SELECT * FROM mechanic_details WHERE mechanicId = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Mechanic availability updated successfully",
      data: updatedMechanic[0],
    });
  } catch (error) {
    console.error("Error updating mechanic availability:", error);
    res.status(500).json({
      success: false,
      message: "Error updating mechanic availability",
      error: error.message,
    });
  }
});

// DELETE /api/mechanics/:id - Soft delete a mechanic
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if mechanic exists
    const [existingMechanic] = await db.execute(
      "SELECT * FROM mechanic WHERE mechanicId = ?",
      [id]
    );

    if (existingMechanic.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    // Soft delete by setting isActive to false
    await db.execute(
      "UPDATE mechanic SET isActive = false WHERE mechanicId = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Mechanic deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mechanic:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting mechanic",
      error: error.message,
    });
  }
});

// GET /api/mechanics/specializations/list - Get all unique specializations
router.get("/specializations/list", async (req, res) => {
  try {
    const [specializations] = await db.execute(
      "SELECT DISTINCT specialization FROM mechanic WHERE isActive = true AND specialization IS NOT NULL ORDER BY specialization"
    );

    res.json({
      success: true,
      data: specializations.map((item) => item.specialization),
    });
  } catch (error) {
    console.error("Error fetching specializations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching specializations",
      error: error.message,
    });
  }
});

module.exports = router;
