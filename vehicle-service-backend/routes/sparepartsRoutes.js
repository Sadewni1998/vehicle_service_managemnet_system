const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/spareparts - Get all spare parts with optional filtering
router.get("/", async (req, res) => {
  try {
    const { category, search, mechanicId, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT 
        sp.*,
        m.mechanicCode,
        m.specialization as mechanicSpecialization,
        s.name as mechanicName
      FROM spareparts sp
      LEFT JOIN mechanic m ON sp.mechanicId = m.mechanicId
      LEFT JOIN staff s ON m.staffId = s.staffId
      WHERE sp.isActive = true
    `;
    let queryParams = [];

    // Add category filter
    if (category) {
      query += " AND sp.category = ?";
      queryParams.push(category);
    }

    // Add mechanic filter
    if (mechanicId) {
      query += " AND sp.mechanicId = ?";
      queryParams.push(mechanicId);
    }

    // Add search filter (searches in partName, partCode, and description)
    if (search) {
      query +=
        " AND (sp.partName LIKE ? OR sp.partCode LIKE ? OR sp.description LIKE ?)";
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add ordering
    query += " ORDER BY sp.partName ASC";

    // Add pagination
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), offset);

    const [spareparts] = await db.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM spareparts sp
      WHERE sp.isActive = true
    `;
    let countParams = [];

    if (category) {
      countQuery += " AND sp.category = ?";
      countParams.push(category);
    }

    if (mechanicId) {
      countQuery += " AND sp.mechanicId = ?";
      countParams.push(mechanicId);
    }

    if (search) {
      countQuery +=
        " AND (sp.partName LIKE ? OR sp.partCode LIKE ? OR sp.description LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: spareparts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching spare parts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching spare parts",
      error: error.message,
    });
  }
});

// GET /api/spareparts/categories - Get all available categories
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      "Engine",
      "Electrical",
      "Body",
      "Suspension",
      "Brakes",
      "Cooling",
      "Transmission",
      "Interior",
      "Exterior",
      "Accessories",
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// GET /api/spareparts/:id - Get a single spare part by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [spareparts] = await db.execute(
      `SELECT 
        sp.*,
        m.mechanicCode,
        m.specialization as mechanicSpecialization,
        s.name as mechanicName
      FROM spareparts sp
      LEFT JOIN mechanic m ON sp.mechanicId = m.mechanicId
      LEFT JOIN staff s ON m.staffId = s.staffId
      WHERE sp.partId = ? AND sp.isActive = true`,
      [id]
    );

    if (spareparts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Spare part not found",
      });
    }

    res.json({
      success: true,
      data: spareparts[0],
    });
  } catch (error) {
    console.error("Error fetching spare part:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching spare part",
      error: error.message,
    });
  }
});

// POST /api/spareparts - Create a new spare part (Admin only)
router.post("/", async (req, res) => {
  try {
    const {
      partCode,
      partName,
      brand,
      description,
      category,
      unitPrice,
      imageUrl,
      stockQuantity = 0,
      mechanicId,
    } = req.body;

    // Validate required fields
    if (!partCode || !partName || !category || !unitPrice) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: partCode, partName, category, unitPrice",
      });
    }

    // Validate category
    const validCategories = [
      "Engine",
      "Electrical",
      "Body",
      "Suspension",
      "Brakes",
      "Cooling",
      "Transmission",
      "Interior",
      "Exterior",
      "Accessories",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Check if part code already exists
    const [existingPart] = await db.execute(
      "SELECT partId FROM spareparts WHERE partCode = ?",
      [partCode]
    );

    if (existingPart.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Part code already exists",
      });
    }

    // Validate mechanicId if provided
    if (mechanicId) {
      const [mechanic] = await db.execute(
        "SELECT mechanicId FROM mechanic WHERE mechanicId = ? AND isActive = true",
        [mechanicId]
      );

      if (mechanic.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid mechanic ID",
        });
      }
    }

    console.log("Creating spare part with data:", {
      partCode,
      partName,
      brand,
      description,
      category,
      unitPrice,
      imageUrl,
      stockQuantity,
      mechanicId,
    });

    // Insert new spare part
    const [result] = await db.execute(
      `INSERT INTO spareparts (partCode, partName, brand, description, category, unitPrice, imageUrl, stockQuantity, mechanicId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partCode,
        partName,
        brand,
        description,
        category,
        unitPrice,
        imageUrl || null,
        stockQuantity,
        mechanicId || null,
      ]
    );

    // Fetch the created spare part
    const [newPart] = await db.execute(
      "SELECT * FROM spareparts WHERE partId = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Spare part created successfully",
      data: newPart[0],
    });
  } catch (error) {
    console.error("Error creating spare part:", error);
    res.status(500).json({
      success: false,
      message: "Error creating spare part: " + error.message,
      error: error.message,
    });
  }
});

// PUT /api/spareparts/:id - Update a spare part (Admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partCode,
      partName,
      brand,
      description,
      category,
      unitPrice,
      imageUrl,
      stockQuantity,
      mechanicId,
      isActive,
    } = req.body;

    // Check if spare part exists
    const [existingPart] = await db.execute(
      "SELECT * FROM spareparts WHERE partId = ?",
      [id]
    );

    if (existingPart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Spare part not found",
      });
    }

    // Validate category if provided
    if (category) {
      const validCategories = [
        "Engine",
        "Electrical",
        "Body",
        "Suspension",
        "Brakes",
        "Cooling",
        "Transmission",
        "Interior",
        "Exterior",
        "Accessories",
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
    }

    // Check if part code already exists (excluding current part)
    if (partCode) {
      const [duplicatePart] = await db.execute(
        "SELECT partId FROM spareparts WHERE partCode = ? AND partId != ?",
        [partCode, id]
      );

      if (duplicatePart.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Part code already exists",
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (partCode !== undefined) {
      updateFields.push("partCode = ?");
      updateValues.push(partCode);
    }
    if (partName !== undefined) {
      updateFields.push("partName = ?");
      updateValues.push(partName);
    }
    if (brand !== undefined) {
      updateFields.push("brand = ?");
      updateValues.push(brand);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push("category = ?");
      updateValues.push(category);
    }
    if (unitPrice !== undefined) {
      updateFields.push("unitPrice = ?");
      updateValues.push(unitPrice);
    }
    if (imageUrl !== undefined) {
      updateFields.push("imageUrl = ?");
      updateValues.push(imageUrl);
    }
    if (stockQuantity !== undefined) {
      updateFields.push("stockQuantity = ?");
      updateValues.push(stockQuantity);
    }
    if (mechanicId !== undefined) {
      // Validate mechanicId if provided and not null
      if (mechanicId !== null) {
        const [mechanic] = await db.execute(
          "SELECT mechanicId FROM mechanic WHERE mechanicId = ? AND isActive = true",
          [mechanicId]
        );

        if (mechanic.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid mechanic ID",
          });
        }
      }
      updateFields.push("mechanicId = ?");
      updateValues.push(mechanicId);
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
      `UPDATE spareparts SET ${updateFields.join(", ")} WHERE partId = ?`,
      updateValues
    );

    // Fetch updated spare part
    const [updatedPart] = await db.execute(
      "SELECT * FROM spareparts WHERE partId = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Spare part updated successfully",
      data: updatedPart[0],
    });
  } catch (error) {
    console.error("Error updating spare part:", error);
    res.status(500).json({
      success: false,
      message: "Error updating spare part",
      error: error.message,
    });
  }
});

// DELETE /api/spareparts/:id - Soft delete a spare part (Admin only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if spare part exists
    const [existingPart] = await db.execute(
      "SELECT * FROM spareparts WHERE partId = ?",
      [id]
    );

    if (existingPart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Spare part not found",
      });
    }

    // Soft delete by setting isActive to false
    await db.execute(
      "UPDATE spareparts SET isActive = false WHERE partId = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Spare part deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting spare part:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting spare part",
      error: error.message,
    });
  }
});

// PUT /api/spareparts/:id/stock - Update stock quantity
router.put("/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;

    if (stockQuantity === undefined || stockQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid stock quantity is required",
      });
    }

    // Check if spare part exists
    const [existingPart] = await db.execute(
      "SELECT * FROM spareparts WHERE partId = ? AND isActive = true",
      [id]
    );

    if (existingPart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Spare part not found",
      });
    }

    // Update stock quantity
    await db.execute(
      "UPDATE spareparts SET stockQuantity = ? WHERE partId = ?",
      [stockQuantity, id]
    );

    // Fetch updated spare part
    const [updatedPart] = await db.execute(
      "SELECT * FROM spareparts WHERE partId = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Stock quantity updated successfully",
      data: updatedPart[0],
    });
  } catch (error) {
    console.error("Error updating stock quantity:", error);
    res.status(500).json({
      success: false,
      message: "Error updating stock quantity",
      error: error.message,
    });
  }
});

// GET /api/spareparts/mechanic/:mechanicId - Get spare parts assigned to a specific mechanic
router.get("/mechanic/:mechanicId", async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate mechanic exists
    const [mechanic] = await db.execute(
      "SELECT mechanicId FROM mechanic WHERE mechanicId = ? AND isActive = true",
      [mechanicId]
    );

    if (mechanic.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mechanic not found",
      });
    }

    let query = `
      SELECT 
        sp.*,
        m.mechanicCode,
        m.specialization as mechanicSpecialization,
        s.name as mechanicName
      FROM spareparts sp
      JOIN mechanic m ON sp.mechanicId = m.mechanicId
      JOIN staff s ON m.staffId = s.staffId
      WHERE sp.mechanicId = ? AND sp.isActive = true
      ORDER BY sp.partName ASC
    `;

    // Add pagination
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";

    const [spareparts] = await db.execute(query, [
      mechanicId,
      parseInt(limit),
      offset,
    ]);

    // Get total count
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM spareparts WHERE mechanicId = ? AND isActive = true",
      [mechanicId]
    );
    const total = countResult[0].total;

    res.json({
      success: true,
      data: spareparts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching spare parts for mechanic:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching spare parts for mechanic",
      error: error.message,
    });
  }
});

// PUT /api/spareparts/:id/assign-mechanic - Assign a mechanic to a spare part
router.put("/:id/assign-mechanic", async (req, res) => {
  try {
    const { id } = req.params;
    const { mechanicId } = req.body;

    // Check if spare part exists
    const [existingPart] = await db.execute(
      "SELECT * FROM spareparts WHERE partId = ? AND isActive = true",
      [id]
    );

    if (existingPart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Spare part not found",
      });
    }

    // Validate mechanicId if provided and not null
    if (mechanicId !== null && mechanicId !== undefined) {
      const [mechanic] = await db.execute(
        "SELECT mechanicId FROM mechanic WHERE mechanicId = ? AND isActive = true",
        [mechanicId]
      );

      if (mechanic.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid mechanic ID",
        });
      }
    }

    // Update mechanic assignment
    await db.execute("UPDATE spareparts SET mechanicId = ? WHERE partId = ?", [
      mechanicId,
      id,
    ]);

    // Fetch updated spare part with mechanic details
    const [updatedPart] = await db.execute(
      `SELECT 
        sp.*,
        m.mechanicCode,
        m.specialization as mechanicSpecialization,
        s.name as mechanicName
      FROM spareparts sp
      LEFT JOIN mechanic m ON sp.mechanicId = m.mechanicId
      LEFT JOIN staff s ON m.staffId = s.staffId
      WHERE sp.partId = ?`,
      [id]
    );

    res.json({
      success: true,
      message: mechanicId
        ? "Mechanic assigned successfully"
        : "Mechanic unassigned successfully",
      data: updatedPart[0],
    });
  } catch (error) {
    console.error("Error assigning mechanic to spare part:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning mechanic to spare part",
      error: error.message,
    });
  }
});

module.exports = router;
