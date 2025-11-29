const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { ensureAuthenticated } = require("../middleware/authMiddleware");

// GET /api/eshop - Get all items from eshop
router.get("/", async (req, res) => {
  try {
    const [items] = await db.execute("SELECT * FROM eshop");
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching eshop items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching eshop items",
      error: error.message,
    });
  }
});

// POST /api/eshop - Add a new item to eshop
router.post("/", async (req, res) => {
  try {
    const {
      itemCode,
      itemName,
      description,
      price,
      quantity,
      discountPercentage,
      itemImage,
      itemBrand,
      itemType,
    } = req.body;

    console.log("POST request body:", req.body);
    console.log("Extracted values:", {
      itemCode,
      itemName,
      description,
      price,
      quantity,
      discountPercentage,
      itemImage,
      itemBrand,
      itemType,
    });

    // Validate required fields
    if (
      !itemCode ||
      !itemName ||
      !price ||
      !quantity ||
      !itemBrand ||
      !itemType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: itemCode, itemName, price, quantity, itemBrand, itemType",
      });
    }

    // Check for duplicate itemCode
    const [existing] = await db.execute(
      "SELECT itemId FROM eshop WHERE itemCode = ?",
      [itemCode]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Item code already exists",
      });
    }

    // Insert new item into eshop table
    const [result] = await db.execute(
      `INSERT INTO eshop (itemCode, itemName, description, price, quantity, discountPercentage, itemImage, itemBrand, itemType, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        itemCode,
        itemName,
        description || null,
        price,
        quantity,
        discountPercentage || 0,
        itemImage || null,
        itemBrand,
        itemType,
        true,
      ]
    );

    console.log("Insert result:", result);

    // Fetch the newly created item
    const [newItem] = await db.execute("SELECT * FROM eshop WHERE itemId = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Item added successfully",
      data: newItem[0],
    });
  } catch (error) {
    console.error("Error adding item to eShop:", error);
    res.status(500).json({
      success: false,
      message: "Error adding item to eShop",
      error: error.message,
    });
  }
});

// PUT /api/eshop/:id - Update an item in eshop
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemCode,
      itemName,
      description,
      price,
      quantity,
      discountPercentage,
      itemImage,
      itemBrand,
      itemType,
    } = req.body;

    // Validate required fields
    if (
      !itemCode ||
      !itemName ||
      !price ||
      !quantity ||
      !itemBrand ||
      !itemType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: itemCode, itemName, price, quantity, itemBrand, itemType",
      });
    }

    // Check if item exists
    const [existing] = await db.execute(
      "SELECT itemId FROM eshop WHERE itemId = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check for duplicate itemCode (excluding current item)
    const [duplicate] = await db.execute(
      "SELECT itemId FROM eshop WHERE itemCode = ? AND itemId != ?",
      [itemCode, id]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Item code already exists",
      });
    }

    // Update item in eshop table
    await db.execute(
      `UPDATE eshop SET itemCode = ?, itemName = ?, description = ?, price = ?, quantity = ?, discountPercentage = ?, itemImage = ?, itemBrand = ?, itemType = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE itemId = ?`,
      [
        itemCode,
        itemName,
        description || null,
        price,
        quantity,
        discountPercentage || 0,
        itemImage || null,
        itemBrand,
        itemType,
        id,
      ]
    );

    // Fetch the updated item
    const [updatedItem] = await db.execute(
      "SELECT * FROM eshop WHERE itemId = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem[0],
    });
  } catch (error) {
    console.error("Error updating item in eShop:", error);
    res.status(500).json({
      success: false,
      message: "Error updating item in eShop",
      error: error.message,
    });
  }
});

// DELETE /api/eshop/:id - Delete an item from eshop
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const [existing] = await db.execute(
      "SELECT itemId FROM eshop WHERE itemId = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Hard delete the item from eshop table
    await db.execute("DELETE FROM eshop WHERE itemId = ?", [id]);

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item from eShop:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting item from eShop",
      error: error.message,
    });
  }
});

// POST /api/eshop/checkout - Create an order from cart items
router.post("/checkout", ensureAuthenticated, async (req, res) => {
  try {
    const { items, paymentMethod, billingAddress, totalAmount } = req.body;
    const customerId = req.user.userId || req.user.customerId;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total amount is required and must be greater than 0",
      });
    }

    // Start transaction
    await db.execute("START TRANSACTION");

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const [orderResult] = await db.execute(
        `INSERT INTO eshop_orders (orderNumber, customerId, items, totalAmount, paymentMethod, billingAddress, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
        [
          orderNumber,
          customerId,
          JSON.stringify(items),
          totalAmount,
          paymentMethod,
          billingAddress ? JSON.stringify(billingAddress) : null,
        ]
      );

      const orderId = orderResult.insertId;

      // Update item quantities in eshop table
      for (const item of items) {
        await db.execute(
          `UPDATE eshop SET quantity = quantity - ? WHERE itemId = ? AND quantity >= ?`,
          [item.quantity || 1, item.id || item.itemId, item.quantity || 1]
        );
      }

      // Commit transaction
      await db.execute("COMMIT");

      // Fetch the created order
      const [order] = await db.execute(
        "SELECT * FROM eshop_orders WHERE orderId = ?",
        [orderId]
      );

      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: {
          orderId: order[0].orderId,
          orderNumber: order[0].orderNumber,
          totalAmount: order[0].totalAmount,
          status: order[0].status,
        },
      });
    } catch (error) {
      // Rollback transaction on error
      await db.execute("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({
      success: false,
      message: "Error processing checkout",
      error: error.message,
    });
  }
});

// GET /api/eshop/orders - Get customer's orders
router.get("/orders", ensureAuthenticated, async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.customerId;

    const [orders] = await db.execute(
      "SELECT * FROM eshop_orders WHERE customerId = ? ORDER BY createdAt DESC",
      [customerId]
    );

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

module.exports = router;
