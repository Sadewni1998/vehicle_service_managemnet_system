const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/eshop");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// GET /api/eshop - Get all items from eshop
router.get("/", async (req, res) => {
  try {
    const [items] = await db.execute("SELECT * FROM eshop");

    // Add full URL to image path
    const itemsWithImageUrl = items.map((item) => {
      if (item.itemImage && !item.itemImage.startsWith("http")) {
        // Assuming the server is running on the same host, construct the URL
        // In production, you might want to use an environment variable for the base URL
        const protocol = req.protocol;
        const host = req.get("host");
        return {
          ...item,
          itemImage: `${protocol}://${host}/${item.itemImage}`,
        };
      }
      return item;
    });

    res.json({ success: true, data: itemsWithImageUrl });
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
router.post("/", upload.single("itemImage"), async (req, res) => {
  try {
    const {
      itemCode,
      itemName,
      description,
      price,
      quantity,
      discountPercentage,
      itemBrand,
      itemType,
    } = req.body;

    // Get image path from uploaded file
    let itemImage = null;
    if (req.file) {
      // Store relative path
      itemImage = "uploads/eshop/" + req.file.filename;
    } else if (req.body.itemImage) {
      // Fallback if image URL is provided as string
      itemImage = req.body.itemImage;
    }

    console.log("POST request body:", req.body);
    console.log("Uploaded file:", req.file);

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
        itemImage,
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
router.put("/:id", upload.single("itemImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemCode,
      itemName,
      description,
      price,
      quantity,
      discountPercentage,
      itemBrand,
      itemType,
    } = req.body;

    // Get image path from uploaded file
    let itemImage = undefined;
    if (req.file) {
      itemImage = "uploads/eshop/" + req.file.filename;
    } else if (req.body.itemImage) {
      // If a string is passed (e.g. existing URL), use it
      itemImage = req.body.itemImage;
    }

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

    // Construct update query dynamically based on whether image is updated
    let query = `UPDATE eshop SET itemCode = ?, itemName = ?, description = ?, price = ?, quantity = ?, discountPercentage = ?, itemBrand = ?, itemType = ?, updatedAt = CURRENT_TIMESTAMP`;
    const params = [
      itemCode,
      itemName,
      description || null,
      price,
      quantity,
      discountPercentage || 0,
      itemBrand,
      itemType,
    ];

    if (itemImage !== undefined) {
      query += `, itemImage = ?`;
      params.push(itemImage);
    }

    query += ` WHERE itemId = ?`;
    params.push(id);

    // Update item in eshop table
    await db.execute(query, params);

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
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

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
