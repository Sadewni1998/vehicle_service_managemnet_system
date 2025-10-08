const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET /api/jobcards/mechanic/:mechanicId
 * Get all jobcards assigned to a specific mechanic
 */
router.get("/mechanic/:mechanicId", async (req, res) => {
  try {
    const { mechanicId } = req.params;

    console.log(`\n🔍 Fetching jobcards for mechanic ${mechanicId}`);

    // Get all jobcards where this mechanic is assigned (either primary or in jobcardMechanic table)
    const [jobcards] = await db.query(
      `SELECT DISTINCT
        j.jobcardId,
        j.bookingId,
        j.mechanicId as primaryMechanicId,
        j.partCode,
        j.status,
        j.serviceDetails,
        j.assignedAt,
        j.completedAt,
        b.vehicleNumber,
        b.vehicleType,
        b.vehicleBrand,
        b.vehicleBrandModel,
        b.name as customerName,
        b.phone as customerPhone,
        b.bookingDate,
        b.timeSlot,
        b.serviceTypes,
        b.assignedMechanics,
        b.assignedSpareParts
      FROM jobcard j
      INNER JOIN booking b ON j.bookingId = b.bookingId
      LEFT JOIN jobcardMechanic jm ON j.jobcardId = jm.jobcardId
      WHERE j.mechanicId = ? OR jm.mechanicId = ?
      ORDER BY j.assignedAt DESC`,
      [mechanicId, mechanicId]
    );

    console.log(
      `✅ Found ${jobcards.length} jobcard(s) for mechanic ${mechanicId}`
    );

    // Get assigned mechanics for each jobcard
    for (let jobcard of jobcards) {
      const [mechanics] = await db.query(
        `SELECT 
          jm.mechanicId,
          m.mechanicName,
          m.mechanicCode,
          m.specialization,
          jm.assignedAt,
          jm.completedAt
        FROM jobcardMechanic jm
        JOIN mechanic m ON jm.mechanicId = m.mechanicId
        WHERE jm.jobcardId = ?
        ORDER BY jm.assignedAt`,
        [jobcard.jobcardId]
      );
      jobcard.assignedMechanics = mechanics;

      // Get assigned spare parts for each jobcard
      const [spareParts] = await db.query(
        `SELECT 
          jsp.partId,
          sp.partCode,
          sp.partName,
          sp.category,
          jsp.quantity,
          jsp.unitPrice,
          jsp.totalPrice,
          jsp.assignedAt,
          jsp.usedAt
        FROM jobcardSparePart jsp
        JOIN spareparts sp ON jsp.partId = sp.partId
        WHERE jsp.jobcardId = ?
        ORDER BY jsp.assignedAt`,
        [jobcard.jobcardId]
      );
      jobcard.assignedSpareParts = spareParts;

      // Calculate total parts cost
      jobcard.totalPartsCost = spareParts.reduce(
        (sum, part) => sum + parseFloat(part.totalPrice),
        0
      );

      // Parse JSON fields
      if (jobcard.serviceDetails) {
        try {
          jobcard.serviceDetails = JSON.parse(jobcard.serviceDetails);
        } catch (e) {
          console.error("Error parsing serviceDetails:", e);
        }
      }
      if (jobcard.serviceTypes) {
        try {
          jobcard.serviceTypes = JSON.parse(jobcard.serviceTypes);
        } catch (e) {
          console.error("Error parsing serviceTypes:", e);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: jobcards.length,
      data: jobcards,
    });
  } catch (error) {
    console.error("❌ Error fetching jobcards for mechanic:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobcards",
      error: error.message,
    });
  }
});

/**
 * GET /api/jobcards/:jobcardId
 * Get a specific jobcard by ID
 */
router.get("/:jobcardId", async (req, res) => {
  try {
    const { jobcardId } = req.params;

    const [jobcards] = await db.query(
      `SELECT 
        j.*,
        b.vehicleNumber,
        b.vehicleType,
        b.vehicleBrand,
        b.vehicleBrandModel,
        b.name as customerName,
        b.phone as customerPhone,
        b.bookingDate,
        b.timeSlot,
        b.serviceTypes
      FROM jobcard j
      INNER JOIN booking b ON j.bookingId = b.bookingId
      WHERE j.jobcardId = ?`,
      [jobcardId]
    );

    if (jobcards.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Jobcard not found",
      });
    }

    const jobcard = jobcards[0];

    // Get assigned mechanics
    const [mechanics] = await db.query(
      `SELECT 
        jm.mechanicId,
        m.mechanicName,
        m.mechanicCode,
        m.specialization,
        jm.assignedAt,
        jm.completedAt
      FROM jobcardMechanic jm
      JOIN mechanic m ON jm.mechanicId = m.mechanicId
      WHERE jm.jobcardId = ?`,
      [jobcardId]
    );
    jobcard.assignedMechanics = mechanics;

    // Get assigned spare parts
    const [spareParts] = await db.query(
      `SELECT 
        jsp.partId,
        sp.partCode,
        sp.partName,
        sp.category,
        jsp.quantity,
        jsp.unitPrice,
        jsp.totalPrice,
        jsp.assignedAt,
        jsp.usedAt
      FROM jobcardSparePart jsp
      JOIN spareparts sp ON jsp.partId = sp.partId
      WHERE jsp.jobcardId = ?`,
      [jobcardId]
    );
    jobcard.assignedSpareParts = spareParts;

    // Calculate total parts cost
    jobcard.totalPartsCost = spareParts.reduce(
      (sum, part) => sum + parseFloat(part.totalPrice),
      0
    );

    // Parse JSON fields
    if (jobcard.serviceDetails) {
      try {
        jobcard.serviceDetails = JSON.parse(jobcard.serviceDetails);
      } catch (e) {
        console.error("Error parsing serviceDetails:", e);
      }
    }
    if (jobcard.serviceTypes) {
      try {
        jobcard.serviceTypes = JSON.parse(jobcard.serviceTypes);
      } catch (e) {
        console.error("Error parsing serviceTypes:", e);
      }
    }

    res.status(200).json({
      success: true,
      data: jobcard,
    });
  } catch (error) {
    console.error("Error fetching jobcard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobcard",
      error: error.message,
    });
  }
});

/**
 * PUT /api/jobcards/:jobcardId/status
 * Update jobcard status
 */
router.put("/:jobcardId/status", async (req, res) => {
  try {
    const { jobcardId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "open",
      "in_progress",
      "ready_for_review",
      "completed",
      "canceled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // If status is completed, set completedAt timestamp
    let updateQuery = "UPDATE jobcard SET status = ?";
    let updateParams = [status];

    if (status === "completed") {
      updateQuery += ", completedAt = NOW()";
    }

    updateQuery += " WHERE jobcardId = ?";
    updateParams.push(jobcardId);

    await db.query(updateQuery, updateParams);

    res.status(200).json({
      success: true,
      message: "Jobcard status updated successfully",
    });
  } catch (error) {
    console.error("Error updating jobcard status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating jobcard status",
      error: error.message,
    });
  }
});

module.exports = router;
