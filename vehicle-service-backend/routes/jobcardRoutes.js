const express = require("express");
const router = express.Router();
const db = require("../config/db");
const {
  ensureAuthenticated,
  checkRole,
} = require("../middleware/authMiddleware");
const { createInvoicePdf } = require("../controllers/invoiceController");
const sendEmail = require("../utils/emailService");

/**
 * PUT /api/jobcards/:jobcardId/assign-mechanics
 * Assign one or more mechanics to a specific jobcard
 * Body: { mechanicIds: number[] }
 */
router.put(
  "/:jobcardId/assign-mechanics",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  async (req, res) => {
    try {
      const { jobcardId } = req.params;
      const { mechanicIds } = req.body;

      if (
        !mechanicIds ||
        !Array.isArray(mechanicIds) ||
        mechanicIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Mechanic IDs array is required and cannot be empty.",
        });
      }

      // Load jobcard and related booking
      const [jobcardRows] = await db.query(
        "SELECT jobcardId, bookingId, status, assignedMechanicIds FROM jobcard WHERE jobcardId = ?",
        [jobcardId]
      );
      if (jobcardRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Jobcard not found",
        });
      }
      const jobcard = jobcardRows[0];

      // Validate mechanics
      const placeholders = mechanicIds.map(() => "?").join(",");
      const [mechanics] = await db.query(
        `SELECT mechanicId, availability FROM mechanic WHERE mechanicId IN (${placeholders}) AND isActive = true`,
        mechanicIds
      );
      if (mechanics.length !== mechanicIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more mechanics not found or inactive.",
        });
      }

      // Ensure all are available
      const unavailable = mechanics.filter(
        (m) => m.availability !== "Available"
      );
      if (unavailable.length > 0) {
        return res.status(400).json({
          success: false,
          message: "One or more mechanics are not available.",
          unavailableMechanics: unavailable.map((m) => m.mechanicId),
        });
      }

      // Determine previous vs new assignments to free removed mechanics later
      let previousMechanicIds = [];
      if (jobcard.assignedMechanicIds) {
        try {
          previousMechanicIds = JSON.parse(jobcard.assignedMechanicIds) || [];
          if (!Array.isArray(previousMechanicIds)) previousMechanicIds = [];
        } catch (_) {
          previousMechanicIds = [];
        }
      }

      const previousSet = new Set(previousMechanicIds.map(Number));
      const newSet = new Set(mechanicIds.map(Number));
      const removedMechanicIds = previousMechanicIds
        .map(Number)
        .filter((mid) => !newSet.has(mid));

      // Update jobcard record (store JSON list). If still open, move to in_progress
      await db.query(
        `UPDATE jobcard 
       SET assignedMechanicIds = ?, 
           status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END 
       WHERE jobcardId = ?`,
        [JSON.stringify(mechanicIds), jobcardId]
      );

      // Sync mapping table
      await db.query("DELETE FROM jobcardMechanic WHERE jobcardId = ?", [
        jobcardId,
      ]);
      for (const mid of mechanicIds) {
        await db.query(
          `INSERT INTO jobcardMechanic (jobcardId, mechanicId) VALUES (?, ?)`,
          [jobcardId, mid]
        );
      }

      // Keep booking JSON in sync and ensure status is at least in_progress
      await db.query(
        `UPDATE booking 
       SET assignedMechanics = ?, 
           status = CASE WHEN status IN ('pending','confirmed','arrived') THEN 'in_progress' ELSE status END
       WHERE bookingId = ?`,
        [JSON.stringify(mechanicIds), jobcard.bookingId]
      );

      // Mark newly assigned mechanics as Busy (idempotent if already Busy)
      await db.query(
        `UPDATE mechanic SET availability = 'Busy' WHERE mechanicId IN (${placeholders})`,
        mechanicIds
      );

      // Free removed mechanics that no longer have other active jobcards
      if (removedMechanicIds.length > 0) {
        const rmPH = removedMechanicIds.map(() => "?").join(",");
        const [activeCounts] = await db.query(
          `SELECT jm.mechanicId, COUNT(*) as cnt
           FROM jobcardMechanic jm
           JOIN jobcard j ON jm.jobcardId = j.jobcardId
           WHERE jm.mechanicId IN (${rmPH})
             AND j.status IN ('open','in_progress','ready_for_review')
           GROUP BY jm.mechanicId`,
          removedMechanicIds
        );

        const busySet = new Set(
          activeCounts.filter((r) => (r.cnt || 0) > 0).map((r) => r.mechanicId)
        );
        const toFree = removedMechanicIds.filter((id) => !busySet.has(id));
        if (toFree.length > 0) {
          const freePH = toFree.map(() => "?").join(",");
          await db.query(
            `UPDATE mechanic SET availability = 'Available' WHERE mechanicId IN (${freePH})`,
            toFree
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: `Assigned ${mechanicIds.length} mechanic(s) to jobcard ${jobcardId}`,
        jobcardId,
        bookingId: jobcard.bookingId,
        assignedMechanics: mechanicIds,
      });
    } catch (error) {
      console.error("❌ Error assigning mechanics to jobcard:", error);
      return res.status(500).json({
        success: false,
        message: "Error assigning mechanics to jobcard",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/jobcards/mechanic/:mechanicId
 * Get all jobcards assigned to a specific mechanic
 */
router.get("/mechanic/:mechanicId", async (req, res) => {
  try {
    const { mechanicId } = req.params;

    console.log(`\n🔍 Fetching jobcards for mechanic ${mechanicId}`);

    // Get all jobcards where this mechanic is assigned via jobcardMechanic mapping
    const [jobcards] = await db.query(
      `SELECT DISTINCT
        j.jobcardId,
        j.bookingId,
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
      INNER JOIN jobcardMechanic jm ON j.jobcardId = jm.jobcardId
      WHERE jm.mechanicId = ?
      ORDER BY j.assignedAt DESC`,
      [mechanicId]
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
          jm.completedAt,
          jm.notes
        FROM jobcardMechanic jm
        JOIN mechanic m ON jm.mechanicId = m.mechanicId
        WHERE jm.jobcardId = ?
        ORDER BY jm.assignedAt`,
        [jobcard.jobcardId]
      );
      jobcard.assignedMechanics = mechanics;

      // Find the current mechanic's notes for this jobcard
      const currentMechanicAssignment = mechanics.find(
        (m) => m.mechanicId == mechanicId
      );
      if (currentMechanicAssignment) {
        jobcard.mechanicNotes = currentMechanicAssignment.notes;
        jobcard.mechanicCompletedAt = currentMechanicAssignment.completedAt;
      }

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
// Place specific routes before parameterized ones to avoid shadowing
router.get(
  "/ready-for-review",
  ensureAuthenticated,
  checkRole(["service_advisor"]),
  async (_req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT 
         j.jobcardId,
         j.bookingId,
         j.status,
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
         b.serviceTypes
       FROM jobcard j
       JOIN booking b ON j.bookingId = b.bookingId
       WHERE j.status = 'ready_for_review'
       ORDER BY j.completedAt DESC, j.assignedAt DESC`
      );

      for (const jc of rows) {
        const [mechanics] = await db.query(
          `SELECT jm.mechanicId, m.mechanicName, m.mechanicCode, m.specialization, jm.assignedAt, jm.completedAt, jm.notes
         FROM jobcardMechanic jm
         JOIN mechanic m ON jm.mechanicId = m.mechanicId
         WHERE jm.jobcardId = ?
         ORDER BY jm.assignedAt`,
          [jc.jobcardId]
        );
        jc.assignedMechanics = mechanics;
        const [spareParts] = await db.query(
          `SELECT jsp.partId, sp.partCode, sp.partName, sp.category, jsp.quantity, jsp.unitPrice, jsp.totalPrice
         FROM jobcardSparePart jsp
         JOIN spareparts sp ON jsp.partId = sp.partId
         WHERE jsp.jobcardId = ?
         ORDER BY jsp.assignedAt`,
          [jc.jobcardId]
        );
        jc.assignedSpareParts = spareParts;
        jc.totalPartsCost = spareParts.reduce(
          (sum, p) => sum + parseFloat(p.totalPrice),
          0
        );
        if (jc.serviceTypes) {
          try {
            jc.serviceTypes = JSON.parse(jc.serviceTypes);
          } catch (_) {}
        }
      }

      return res
        .status(200)
        .json({ success: true, count: rows.length, data: rows });
    } catch (error) {
      console.error("❌ Error listing ready-for-review jobcards:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching jobcards",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/jobcards/stats/service-advisor
 * Returns dashboard summary stats for Service Advisor
 * - availableMechanics: count of active mechanics with availability 'Available'
 * - pendingJobcardReviews: count of jobcards with status 'ready_for_review'
 * - assignedJobs: count of DISTINCT jobcards assigned to mechanics where status is not completed/canceled
 * - jobsDoneToday: count of jobcards completed today
 */
router.get(
  "/stats/service-advisor",
  ensureAuthenticated,
  checkRole(["service_advisor", "manager"]),
  async (_req, res) => {
    try {
      const [[{ count: availableMechanics }]] = await db.query(
        "SELECT COUNT(*) AS count FROM mechanic WHERE isActive = TRUE AND availability = 'Available'"
      );

      const [[{ count: pendingJobcardReviews }]] = await db.query(
        "SELECT COUNT(*) AS count FROM jobcard WHERE status = 'ready_for_review'"
      );

      const [[{ count: assignedJobs }]] = await db.query(
        `SELECT COUNT(DISTINCT j.jobcardId) AS count
         FROM jobcard j
         JOIN jobcardMechanic jm ON j.jobcardId = jm.jobcardId
         WHERE j.status IN ('open','in_progress','ready_for_review')`
      );

      const [[{ count: jobsDoneToday }]] = await db.query(
        "SELECT COUNT(*) AS count FROM jobcard WHERE status = 'completed' AND DATE(completedAt) = CURDATE()"
      );

      return res.status(200).json({
        success: true,
        data: {
          availableMechanics: Number(availableMechanics) || 0,
          pendingJobcardReviews: Number(pendingJobcardReviews) || 0,
          assignedJobs: Number(assignedJobs) || 0,
          jobsDoneToday: Number(jobsDoneToday) || 0,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching service advisor stats:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching service advisor stats",
        error: error.message,
      });
    }
  }
);

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

// (moved earlier to avoid being shadowed by /:jobcardId)

/**
 * PUT /api/jobcards/:jobcardId/status
 * Update jobcard status
 */
router.put(
  "/:jobcardId/status",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  async (req, res) => {
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
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      // Restrict completion: enforce approval flow. Completion must go via /:jobcardId/approve
      if (status === "completed") {
        return res.status(400).json({
          success: false,
          message:
            "Completing a jobcard is only allowed via the approval endpoint (/api/jobcards/:jobcardId/approve) after mechanics finish.",
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

      // Note: completion side-effects (free mechanics, verify booking) occur in /:jobcardId/approve

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
  }
);

/**
 * PUT /api/jobcards/:jobcardId/mechanics/:mechanicId/notes
 * Update notes for a specific mechanic's work on a jobcard
 */
router.put(
  "/:jobcardId/mechanics/:mechanicId/notes",
  ensureAuthenticated,
  checkRole(["mechanic"]),
  async (req, res) => {
    try {
      const { jobcardId, mechanicId } = req.params;
      const { notes } = req.body;

      // Validate jobcard exists
      const [jcRows] = await db.query(
        "SELECT jobcardId, bookingId, status FROM jobcard WHERE jobcardId = ?",
        [jobcardId]
      );
      if (jcRows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Jobcard not found" });
      }

      // Validate assignment exists
      const [assignRows] = await db.query(
        "SELECT jobcardMechanicId FROM jobcardMechanic WHERE jobcardId = ? AND mechanicId = ?",
        [jobcardId, mechanicId]
      );
      if (assignRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "This mechanic is not assigned to the specified jobcard",
        });
      }

      // Update notes in jobcardMechanic table
      await db.query(
        "UPDATE jobcardMechanic SET notes = ? WHERE jobcardId = ? AND mechanicId = ?",
        [notes || null, jobcardId, mechanicId]
      );

      return res.status(200).json({
        success: true,
        message: "Notes updated successfully",
        jobcardId: Number(jobcardId),
        mechanicId: Number(mechanicId),
        notes: notes || null,
      });
    } catch (error) {
      console.error("❌ Error updating mechanic notes:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating notes",
        error: error.message,
      });
    }
  }
);

/**
 * PUT /api/jobcards/:jobcardId/mechanics/:mechanicId/complete
 * Mark a specific mechanic's work on a jobcard as completed.
 * If all assigned mechanics have completed, the jobcard is marked completed.
 */
router.put(
  "/:jobcardId/mechanics/:mechanicId/complete",
  ensureAuthenticated,
  checkRole(["mechanic"]),
  async (req, res) => {
    try {
      const { jobcardId, mechanicId } = req.params;
      const { notes } = req.body; // Optional notes when completing

      // Validate jobcard exists
      const [jcRows] = await db.query(
        "SELECT jobcardId, bookingId, status FROM jobcard WHERE jobcardId = ?",
        [jobcardId]
      );
      if (jcRows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Jobcard not found" });
      }
      const jobcard = jcRows[0];

      // Validate assignment exists
      const [assignRows] = await db.query(
        "SELECT jobcardMechanicId, completedAt FROM jobcardMechanic WHERE jobcardId = ? AND mechanicId = ?",
        [jobcardId, mechanicId]
      );
      if (assignRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "This mechanic is not assigned to the specified jobcard",
        });
      }

      const alreadyCompleted = assignRows[0].completedAt != null;

      if (!alreadyCompleted) {
        // Update jobcardMechanic with completion and notes
        await db.query(
          "UPDATE jobcardMechanic SET completedAt = NOW(), notes = ? WHERE jobcardId = ? AND mechanicId = ? AND completedAt IS NULL",
          [notes || null, jobcardId, mechanicId]
        );
      }

      // Check remaining mechanics for this jobcard
      const [[remainingRow]] = await db.query(
        "SELECT COUNT(*) AS remaining FROM jobcardMechanic WHERE jobcardId = ? AND completedAt IS NULL",
        [jobcardId]
      );

      const remaining = remainingRow?.remaining ?? 0;

      // If all mechanics are done, mark jobcard ready_for_review (awaiting advisor approval)
      let jobcardUpdated = false;
      if (remaining === 0) {
        await db.query(
          "UPDATE jobcard SET status = 'ready_for_review', completedAt = NOW() WHERE jobcardId = ?",
          [jobcardId]
        );
        jobcardUpdated = true;
      }

      // Provide list of remaining mechanic IDs
      let remainingMechanicIds = [];
      if (remaining > 0) {
        const [incompleteRows] = await db.query(
          "SELECT mechanicId FROM jobcardMechanic WHERE jobcardId = ? AND completedAt IS NULL",
          [jobcardId]
        );
        remainingMechanicIds = incompleteRows.map((r) => r.mechanicId);
      }

      return res.status(200).json({
        success: true,
        message: alreadyCompleted
          ? "Mechanic completion was already recorded."
          : "Mechanic marked as completed successfully.",
        jobcardId: Number(jobcardId),
        mechanicId: Number(mechanicId),
        jobcardReadyForReview: jobcardUpdated,
        remainingCount: remaining,
        remainingMechanicIds,
      });
    } catch (error) {
      console.error("❌ Error marking mechanic as completed:", error);
      return res.status(500).json({
        success: false,
        message: "Error marking mechanic as completed",
        error: error.message,
      });
    }
  }
);

/**
 * PUT /api/jobcards/:jobcardId/approve
 * Service Advisor approval: finalize jobcard, free mechanics, and set booking status to 'verified'.
 */
router.put(
  "/:jobcardId/approve",
  ensureAuthenticated,
  checkRole(["service_advisor"]),
  async (req, res) => {
    try {
      const { jobcardId } = req.params;

      // Load jobcard and ensure it is ready_for_review
      const [rows] = await db.query(
        "SELECT jobcardId, bookingId, status FROM jobcard WHERE jobcardId = ?",
        [jobcardId]
      );
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Jobcard not found" });
      }
      const jobcard = rows[0];
      if (jobcard.status !== "ready_for_review") {
        return res.status(400).json({
          success: false,
          message:
            "Jobcard is not ready for approval. All mechanics must complete first.",
        });
      }

      // Complete jobcard
      await db.query(
        "UPDATE jobcard SET status = 'completed', completedAt = NOW() WHERE jobcardId = ?",
        [jobcardId]
      );

      // Free mechanics who no longer have active jobs
      const [assignedRows] = await db.query(
        "SELECT mechanicId FROM jobcardMechanic WHERE jobcardId = ?",
        [jobcardId]
      );
      const mechanicIds = assignedRows.map((r) => r.mechanicId);
      if (mechanicIds.length > 0) {
        const placeholders = mechanicIds.map(() => "?").join(",");
        const [activeCounts] = await db.query(
          `SELECT jm.mechanicId, COUNT(*) as cnt
         FROM jobcardMechanic jm
         JOIN jobcard j ON jm.jobcardId = j.jobcardId
         WHERE jm.mechanicId IN (${placeholders})
           AND j.status IN ('open','in_progress','ready_for_review')
         GROUP BY jm.mechanicId`,
          mechanicIds
        );
        const busySet = new Set(
          activeCounts.filter((r) => (r.cnt || 0) > 0).map((r) => r.mechanicId)
        );
        const toFree = mechanicIds.filter((id) => !busySet.has(id));
        if (toFree.length > 0) {
          const freePH = toFree.map(() => "?").join(",");
          await db.query(
            `UPDATE mechanic SET availability = 'Available' WHERE mechanicId IN (${freePH})`,
            toFree
          );
        }
      }

      // Mark related booking as 'verified'
      await db.query(
        "UPDATE booking SET status = 'verified' WHERE bookingId = ?",
        [jobcard.bookingId]
      );

      // Automatically generate and send invoice email
      try {
        console.log(
          `Jobcard approved. Status changed to verified for booking ${jobcard.bookingId}. Generating invoice...`
        );
        const { pdfBuffer, invoiceData } = await createInvoicePdf(
          jobcard.bookingId
        );

        const customerEmail = invoiceData.customer.email;
        console.log(
          `Customer email for booking ${jobcard.bookingId}: ${customerEmail}`
        );

        if (customerEmail && customerEmail !== "N/A") {
          const subject = `Invoice for Booking #${jobcard.bookingId} - Hybrid Lanka`;
          const text = `Dear ${invoiceData.customer.name},\n\nYour booking #${jobcard.bookingId} has been verified. Please find the attached invoice.\n\nThank you,\nHybrid Lanka`;
          const attachments = [
            {
              filename: `invoice-${jobcard.bookingId}.pdf`,
              content: pdfBuffer,
            },
          ];

          console.log(`Attempting to send email to ${customerEmail}...`);
          await sendEmail(customerEmail, subject, text, attachments);
          console.log(`Invoice sent successfully to ${customerEmail}`);
        } else {
          console.log("Customer email not found or is 'N/A', skipping email.");
        }
      } catch (emailError) {
        console.error("Error generating/sending invoice email:", emailError);
        // Don't fail the request if email fails, just log it.
      }

      return res.status(200).json({
        success: true,
        message: "Jobcard approved. Mechanics freed and booking verified.",
        jobcardId: Number(jobcardId),
        bookingId: Number(jobcard.bookingId),
        freedMechanics: mechanicIds || [],
      });
    } catch (error) {
      console.error("❌ Error approving jobcard:", error);
      return res.status(500).json({
        success: false,
        message: "Error approving jobcard",
        error: error.message,
      });
    }
  }
);

module.exports = router;
