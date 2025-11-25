// controllers/invoiceController.js

const db = require("../config/db");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * Generate PDF invoice for a booking
 */
const generateInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;

    console.log(`Generating invoice for booking ID: ${bookingId}`);

    // Get booking details with all related information
    const [bookings] = await db.query(
      `SELECT b.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail, c.address as customerAddress
       FROM booking b
       LEFT JOIN customer c ON b.customerId = c.customerId
       WHERE b.bookingId = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookings[0];
    console.log("Booking found:", booking.bookingId);

    // Enforce precondition: Invoice can be generated only after Service Advisor verifies the job (booking.status = 'verified').
    if (booking.status !== "verified") {
      return res.status(400).json({
        message:
          "Invoice can be generated only after jobcard approval. Please have the Service Advisor approve the jobcard to verify the booking.",
        bookingStatus: booking.status,
      });
    }

    // Get assigned mechanics details
    let assignedMechanicsDetails = [];
    if (booking.assignedMechanics) {
      try {
        const mechanicIds = JSON.parse(booking.assignedMechanics);
        if (Array.isArray(mechanicIds) && mechanicIds.length > 0) {
          const placeholders = mechanicIds.map(() => "?").join(",");
          const [mechanics] = await db.query(
            `SELECT m.mechanicId, m.mechanicCode, s.name as mechanicName, m.specialization, m.experienceYears, m.hourlyRate
             FROM mechanic m 
             JOIN staff s ON m.staffId = s.staffId 
             WHERE m.mechanicId IN (${placeholders})`,
            mechanicIds
          );
          assignedMechanicsDetails = mechanics;
        }
      } catch (error) {
        console.error("Error parsing assigned mechanics:", error);
      }
    }

    // Get assigned spare parts details
    let assignedSparePartsDetails = [];
    if (booking.assignedSpareParts) {
      try {
        const spareParts = JSON.parse(booking.assignedSpareParts);
        if (Array.isArray(spareParts) && spareParts.length > 0) {
          const partIds = spareParts.map((sp) => sp.partId);
          const placeholders = partIds.map(() => "?").join(",");
          const [parts] = await db.query(
            `SELECT partId, partName, partCode, category, unitPrice 
             FROM spareparts 
             WHERE partId IN (${placeholders})`,
            partIds
          );

          assignedSparePartsDetails = parts.map((part) => {
            const assignedPart = spareParts.find(
              (sp) => sp.partId === part.partId
            );
            return {
              ...part,
              assignedQuantity: assignedPart ? assignedPart.quantity : 1,
              totalPrice:
                part.unitPrice * (assignedPart ? assignedPart.quantity : 1),
            };
          });
        }
      } catch (error) {
        console.error("Error parsing assigned spare parts:", error);
      }
    }

    // Parse service types
    let serviceTypes = [];
    if (booking.serviceTypes) {
      try {
        serviceTypes = JSON.parse(booking.serviceTypes);
      } catch (error) {
        serviceTypes = booking.serviceTypes.split(",").map((s) => s.trim());
      }
    }

    // Calculate totals (ensure numeric math: MySQL DECIMAL fields arrive as strings)
    const toNum = (v) => {
      const n = typeof v === "string" ? parseFloat(v) : v;
      return Number.isFinite(n) ? n : 0;
    };

    // Normalize parts pricing where unitPrice may be DECIMAL string
    assignedSparePartsDetails = assignedSparePartsDetails.map((part) => {
      const qty = toNum(part.assignedQuantity || 1);
      const unit = toNum(part.unitPrice);
      const totalPrice = unit * qty;
      return { ...part, assignedQuantity: qty, unitPrice: unit, totalPrice };
    });

    const laborCost = assignedMechanicsDetails.reduce((total, mechanic) => {
      return total + toNum(mechanic.hourlyRate);
    }, 0);

    const partsCost = assignedSparePartsDetails.reduce((total, part) => {
      return total + toNum(part.totalPrice);
    }, 0);

    const subtotal = laborCost + partsCost;
    // As per latest requirement, remove tax from total calculation
    const taxRate = 0; // Previously 0.15 (15%)
    const tax = 0; // No tax applied
    const total = +subtotal.toFixed(2);

    // Helper: format a date with Sri Lankan timezone
    const formatSLDate = (value) => {
      try {
        if (!value) return "-";
        const d =
          typeof value === "string" || typeof value === "number"
            ? new Date(value)
            : value;
        return d.toLocaleDateString("en-GB", {
          timeZone: "Asia/Colombo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }); // DD/MM/YYYY
      } catch (_) {
        return String(value);
      }
    };

    // Fetch jobcard summary for this booking (for template fields)
    let jobcardInfo = { jobcardId: null, completedAt: null };
    try {
      const [jcRows] = await db.query(
        "SELECT jobcardId, completedAt FROM jobcard WHERE bookingId = ? ORDER BY jobcardId DESC LIMIT 1",
        [bookingId]
      );
      if (jcRows && jcRows.length > 0) {
        jobcardInfo.jobcardId = jcRows[0].jobcardId;
        jobcardInfo.completedAt = jcRows[0].completedAt;
      }
    } catch (_) {}

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: `INV-${bookingId}-${Date.now()}`,
      // Use booking date from DB for invoice date as requested, formatted for Sri Lanka
      invoiceDate: booking.bookingDate
        ? formatSLDate(booking.bookingDate)
        : formatSLDate(new Date()),
      bookingId: bookingId,
      currency: "LKR",
      customer: {
        name: booking.customerName || booking.name,
        phone: booking.customerPhone || booking.phone,
        email: booking.customerEmail || "N/A",
        id: booking.customerId || null,
        address: booking.customerAddress || "N/A",
      },
      vehicle: {
        number: booking.vehicleNumber,
        type: booking.vehicleType,
        brand: booking.vehicleBrand,
        model: booking.vehicleBrandModel,
        year: booking.manufacturedYear,
        fuelType: booking.fuelType,
        transmission: booking.transmissionType,
      },
      service: {
        date: formatSLDate(booking.bookingDate),
        timeSlot: booking.timeSlot,
        types: serviceTypes,
        specialRequests: booking.specialRequests,
        bookingCreatedAt: booking.createdAt
          ? new Date(booking.createdAt).toLocaleString("en-GB", {
              timeZone: "Asia/Colombo",
            })
          : "-",
        jobcardId: jobcardInfo.jobcardId || "-",
        completedAt: jobcardInfo.completedAt
          ? new Date(jobcardInfo.completedAt).toLocaleString("en-GB", {
              timeZone: "Asia/Colombo",
            })
          : "-",
        serviceAdvisor: "-",
      },
      mechanics: assignedMechanicsDetails,
      parts: assignedSparePartsDetails,
      pricing: {
        laborCost: laborCost,
        partsCost: partsCost,
        subtotal: subtotal,
        tax: tax,
        total: total,
      },
    };

    console.log("Invoice data prepared:", invoiceData);

    // Store invoice data in database
    try {
      await db.query(
        `INSERT INTO invoices (invoiceNumber, bookingId, customerId, invoiceDate, currency, totalAmount, laborCost, partsCost, tax, status, invoiceData)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?)`,
        [
          invoiceData.invoiceNumber,
          bookingId,
          booking.customerId,
          invoiceData.invoiceDate,
          invoiceData.currency,
          invoiceData.pricing.total,
          invoiceData.pricing.laborCost,
          invoiceData.pricing.partsCost,
          invoiceData.pricing.tax,
          JSON.stringify(invoiceData),
        ]
      );
      console.log("Invoice stored in database");
    } catch (dbError) {
      console.error("Error storing invoice in database:", dbError);
      // Continue with PDF generation even if DB storage fails
    }

    // Generate HTML for the invoice
    const htmlContent = generateInvoiceHTML(invoiceData);

    // Generate PDF using Puppeteer
    console.log("Starting PDF generation with Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    // Wait for web fonts to be fully loaded to ensure exact rendering
    try {
      await page.evaluateHandle("document.fonts.ready");
    } catch (_) {}

    // Calculate dynamic scale to fit content into one A4 page height
    const contentHeight = await page.evaluate(() => document.body.scrollHeight);
    const mmToPx = (mm) => (mm * 96) / 25.4;
    const a4HeightPx = mmToPx(297);
    // 0.5 inch margins (12.7mm) on all sides
    const marginMm = 12.7;
    const availableHeightPx = a4HeightPx - 2 * mmToPx(marginMm);
    let scale = 1;
    if (contentHeight > availableHeightPx) {
      scale = Math.max(0.1, Math.min(1, availableHeightPx / contentHeight));
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale,
      margin: {
        top: `${marginMm}mm`,
        right: `${marginMm}mm`,
        bottom: `${marginMm}mm`,
        left: `${marginMm}mm`,
      },
    });

    await browser.close();
    console.log("PDF generated successfully, size:", pdfBuffer.length);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${bookingId}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({
      message: "Error generating invoice",
      error: error.message,
    });
  }
};

/**
 * Generate HTML content for the invoice
 */
const generateInvoiceHTML = (data) => {
  // Build line items: include service labor and spare parts; discount not tracked -> 0.00; gross = amount
  const items = [];
  if (data.pricing.laborCost > 0) {
    items.push({
      description: `Labor charges (${data.mechanics.length} mechanic${
        data.mechanics.length === 1 ? "" : "s"
      })`,
      unitPrice: data.pricing.laborCost,
      qty: 1,
      amount: data.pricing.laborCost,
      discount: 0,
      gross: data.pricing.laborCost,
    });
  }
  for (const part of data.parts) {
    const qty = part.assignedQuantity || 1;
    const unit = part.unitPrice || 0;
    const amt = part.totalPrice || unit * qty;
    items.push({
      description: part.partName,
      unitPrice: unit,
      qty: qty,
      amount: amt,
      discount: 0,
      gross: amt,
    });
  }

  const money = (n) =>
    Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const itemsHtml =
    items.length === 0
      ? `<tr><td colspan="6" style="text-align:center; color:#777;">No items</td></tr>`
      : items
          .map(
            (it) => `
        <tr>
          <td>${it.description}</td>
          <td>${money(it.unitPrice)}</td>
          <td>${it.qty}</td>
          <td>${money(it.amount)}</td>
          <td>${money(it.discount)}</td>
          <td>${money(it.gross)}</td>
        </tr>`
          )
          .join("\n");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hybrid Lanka Invoice</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    ${getFontFaceCSS()}
  body { background-color: #ffffff; font-family: 'Aptos', 'Segoe UI', Calibri, Arial, Helvetica, sans-serif; color: #333; margin: 0; padding: 0; font-size: 12pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* Remove internal padding to rely on 0.5in PDF margins */
  .invoice-page { background: #fff; width: 100%; max-width: 100%; margin: 0; padding: 0; box-shadow: none; }
  /* Header */
  .header-section { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding-bottom: 6px; }
  .logo { grid-column: 1 / 2; justify-self: start; }
  .logo img { height: 64px; width: auto; display: block; }
  .company-details { grid-column: 2 / 3; text-align: center; }
  .company-details h2 { margin: 0 0 4px 0; font-size: 26pt; font-weight: 700; color: #D90429; font-family: 'Eras Bold ITC', 'Aptos Display', 'ErasITC-Bold', 'Arial Black', Arial, sans-serif; }
  .company-details .tagline { margin: 0 0 6px 0; font-size: 12pt; color: #D90429; }
  .company-details .contact { margin: 0; font-size: 12pt; color: #111; }
    /* Title */
  .title-section { text-align: center; margin: 16px 0; }
  .title-section h1 { font-family: 'Aptos Display', 'Aptos', 'Segoe UI', Calibri, Arial, sans-serif; font-size: 14pt; font-weight: 700; color: #111; letter-spacing: 0.5px; display: inline-block; }
  /* Details Grid */
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
  .box-table { width: 100%; border-collapse: collapse; }
  .box-table, .box-table th, .box-table td { border: 1px solid #999; }
  .box-table thead th { background-color: #e6e6e6; text-align: left; padding: 6px 8px; font-weight: 700; font-family: 'Aptos Display', 'Aptos', 'Segoe UI', Calibri, Arial, sans-serif; font-size: 12pt; }
  .box-table tbody td { padding: 6px 8px; text-align: left; vertical-align: top; }
  .box-table tbody td:first-child { width: 40%; font-weight: 700; color: #444; }
    /* Items Table */
    .items-table { width: 100%; border-collapse: collapse; }
  .items-table thead { background-color: #333A45; color: #fff; }
  .items-table thead th { font-family: 'Aptos Display', 'Aptos', 'Segoe UI', Calibri, Arial, sans-serif; font-weight: 700; font-size: 12pt; }
  .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .items-table th:not(:first-child), .items-table td:not(:first-child) { text-align: right; }
    .items-table tbody tr:nth-child(even) { background-color: #f9f9f9; }
    .items-table tfoot .total-label { text-align: right; font-weight: 700; font-size: 16px; border: none; padding-top: 15px; }
    .items-table tfoot .total-value { text-align: right; font-weight: 700; font-size: 16px; border: 1px solid #ddd; background-color: #f9f9f9; }
    /* Footer */
    .footer-section { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
  /* Use PDF generator margins instead of CSS margins to avoid double spacing */
  @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  <div class="invoice-page">
    <header class="header-section">
      <div class="logo"><img src="data:image/png;base64,${getLogoBase64()}" alt="Hybrid Lanka Logo" /></div>
      <div class="company-details">
        <h2>Hybrid Lanka</h2>
        <p class="tagline">Total Solution for Your Hybrid Car</p>
        <p class="contact">134/3 Horana road, Kesbewa, Sri Lanka &nbsp;&nbsp;&nbsp; Tel: 0112 620 757</p>
      </div>
      <div></div>
    </header>

    <section class="title-section">
      <h1>INVOICE</h1>
    </section>

    <section class="details-grid">
      <div class="detail-box">
        <table class="box-table">
          <thead><tr><th colspan="2">Customer Details</th></tr></thead>
          <tbody>
            <tr><td>Customer Name</td><td>${data.customer.name || "-"}</td></tr>
            <tr><td>Customer No.</td><td>${data.customer.id || "-"}</td></tr>
            <tr><td>Contact No.</td><td>${data.customer.phone || "-"}</td></tr>
            <tr><td>Address</td><td>${data.customer.address || "-"}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="detail-box">
        <table class="box-table">
          <thead><tr><th colspan="2">Invoice Details</th></tr></thead>
          <tbody>
            <tr><td>Invoice No.</td><td>${data.invoiceNumber}</td></tr>
            <tr><td>Date</td><td>${data.invoiceDate}</td></tr>
            <tr><td>Currency</td><td>${data.currency}</td></tr>
            <tr><td>Service Advisor</td><td>${
              data.service.serviceAdvisor || "-"
            }</td></tr>
          </tbody>
        </table>
      </div>
      <div class="detail-box">
        <table class="box-table">
          <thead><tr><th colspan="2">Vehicle Details</th></tr></thead>
          <tbody>
            <tr><td>Vehicle No.</td><td>${data.vehicle.number || "-"}</td></tr>
            <tr><td>Brand & Model</td><td>${data.vehicle.brand || "-"} ${
    data.vehicle.model || ""
  }</td></tr>
            <tr><td>Year</td><td>${data.vehicle.year || "-"}</td></tr>
            <tr><td>Fuel Type</td><td>${data.vehicle.fuelType || "-"}</td></tr>
            <tr><td>Transmission</td><td>${
              data.vehicle.transmission || "-"
            }</td></tr>
          </tbody>
        </table>
      </div>
      <div class="detail-box">
        <table class="box-table">
          <thead><tr><th colspan="2">Service Details</th></tr></thead>
          <tbody>
            <tr><td>Booking ID</td><td>${data.bookingId}</td></tr>
            <tr><td>Booking Date/Time</td><td>${
              data.service.bookingCreatedAt || "-"
            }</td></tr>
            <tr><td>Jobcard ID</td><td>${data.service.jobcardId}</td></tr>
            <tr><td>Completed Date</td><td>${data.service.completedAt}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="items-section">
      <table class="items-table">
        <thead>
          <tr>
            <th>Service/ Parts Used</th>
            <th>Unit Price</th>
            <th>QTY</th>
            <th>Amount (LKR)</th>
            <th>Discount</th>
            <th>Gross Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="total-label">Total Invoice Value</td>
            <td class="total-value">LKR ${money(data.pricing.total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <footer class="footer-section">
      <p>Page 1 of 1</p>
    </footer>

  </div>
</body>
</html>`;
};

/**
 * Get logo as base64 string
 */
const getLogoBase64 = () => {
  try {
    // Path to the logo file in the public directory
    const logoPath = path.join(__dirname, "../../public/logo.png");

    // Check if logo file exists
    if (fs.existsSync(logoPath)) {
      // Read the logo file and convert to base64
      const logoBuffer = fs.readFileSync(logoPath);
      return logoBuffer.toString("base64");
    } else {
      // Try alternative path
      const altPath = path.join(__dirname, "../public/logo.png");
      if (fs.existsSync(altPath)) {
        const logoBuffer = fs.readFileSync(altPath);
        return logoBuffer.toString("base64");
      }
      return "";
    }
  } catch (error) {
    console.error("Error reading logo file:", error);
    return "";
  }
};

// Attempt to embed fonts if available in public/fonts
const getFontFaceCSS = () => {
  try {
    const fontsDir = path.join(__dirname, "../../public/fonts");
    if (!fs.existsSync(fontsDir)) return "";

    const files = fs
      .readdirSync(fontsDir)
      .filter((f) => /\.(woff2|woff|ttf)$/i.test(f));
    const resolveDataUrl = (filename) => {
      const p = path.join(fontsDir, filename);
      const b64 = fs.readFileSync(p).toString("base64");
      const lower = filename.toLowerCase();
      const mime = lower.endsWith(".woff2")
        ? "font/woff2"
        : lower.endsWith(".woff")
        ? "font/woff"
        : "font/ttf";
      return `data:${mime};base64,${b64}`;
    };

    const findFirst = (regex) => {
      const match = files.find((f) => regex.test(f));
      return match ? resolveDataUrl(match) : null;
    };

    const parts = [];
    // Aptos Regular (body)
    const aptosUrl =
      findFirst(/aptos[^/]*\b(regular|roman)\b.*\.(woff2?|woff|ttf)$/i) ||
      findFirst(/^aptos\.(ttf|woff2?|woff)$/i) ||
      findFirst(/aptos[^]*\.(ttf|woff2?|woff)$/i);
    if (aptosUrl) {
      parts.push(
        `@font-face{font-family:'Aptos';src:url(${aptosUrl}) format('woff2');font-weight:400;font-style:normal;font-display:swap;}`
      );
    }
    // Aptos Display Bold (headings)
    const aptosDispUrl =
      findFirst(/aptos\s*display[^/]*\b(bold|700)\b.*\.(woff2?|woff|ttf)$/i) ||
      findFirst(/aptos\s*display[^]*\.(ttf|woff2?|woff)$/i);
    if (aptosDispUrl) {
      parts.push(
        `@font-face{font-family:'Aptos Display';src:url(${aptosDispUrl}) format('woff2');font-weight:700;font-style:normal;font-display:swap;}`
      );
    }
    // Eras Bold ITC (company title)
    const erasUrl =
      findFirst(/eras[^/]*\b(bold|700)\b[^/]*itc[^/]*\.(woff2?|woff|ttf)$/i) ||
      findFirst(/eras[^]*itc[^]*\.(ttf|woff2?|woff)$/i);
    if (erasUrl) {
      parts.push(
        `@font-face{font-family:'Eras Bold ITC';src:url(${erasUrl}) format('woff2');font-weight:700;font-style:normal;font-display:swap;}`
      );
    }

    return parts.join("\n");
  } catch (e) {
    return "";
  }
};

/**
 * Get all invoices for a customer
 */
const getCustomerInvoices = async (req, res) => {
  try {
    const customerId = req.user.id; // Assuming user is authenticated and has id

    const [invoices] = await db.query(
      `SELECT i.invoiceId, i.invoiceNumber, i.bookingId, i.invoiceDate, i.currency, i.totalAmount, i.laborCost, i.partsCost, i.tax, i.status, i.createdAt, i.invoiceData,
              b.vehicleNumber, b.vehicleBrand, b.vehicleBrandModel, b.serviceTypes, b.bookingDate as serviceDate
       FROM invoices i
       LEFT JOIN booking b ON i.bookingId = b.bookingId
       WHERE i.customerId = ?
       ORDER BY i.createdAt DESC`,
      [customerId]
    );

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: error.message,
    });
  }
};

/**
 * Finalize an invoice for a booking: transitions booking from 'verified' to 'completed'.
 * Preconditions:
 * - Booking exists and is currently 'verified'
 * - Related jobcard exists and is 'completed'
 */
const finalizeInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Load booking
    const [bookings] = await db.query(
      "SELECT bookingId, status FROM booking WHERE bookingId = ?",
      [bookingId]
    );
    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    const booking = bookings[0];

    if (booking.status !== "verified") {
      return res.status(400).json({
        success: false,
        message:
          "Booking must be 'verified' before it can be finalized to 'completed'.",
        currentStatus: booking.status,
      });
    }

    // Ensure related jobcard exists and is completed
    const [jcRows] = await db.query(
      "SELECT jobcardId, status FROM jobcard WHERE bookingId = ? LIMIT 1",
      [bookingId]
    );
    if (jcRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No jobcard found for this booking.",
      });
    }
    if (jcRows[0].status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Jobcard must be completed before finalizing the invoice.",
        jobcardStatus: jcRows[0].status,
      });
    }

    // Transition booking to completed
    await db.query(
      "UPDATE booking SET status = 'completed' WHERE bookingId = ?",
      [bookingId]
    );

    // Update invoice status to finalized if it exists
    try {
      await db.query(
        "UPDATE invoices SET status = 'finalized' WHERE bookingId = ?",
        [bookingId]
      );
    } catch (invoiceError) {
      console.warn("Could not update invoice status:", invoiceError);
    }

    return res.status(200).json({
      success: true,
      message: "Invoice finalized and booking marked as 'completed'",
      bookingId: Number(bookingId),
    });
  } catch (error) {
    console.error("❌ Error finalizing invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Error finalizing invoice",
      error: error.message,
    });
  }
};

/**
 * Download existing invoice PDF for customers
 * Only allows download if invoice exists for the customer's booking
 */
const downloadCustomerInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const customerId = req.user.id;

    console.log(
      `Customer ${customerId} requesting invoice download for booking ${bookingId}`
    );

    // First, check if the booking belongs to this customer
    const [bookings] = await db.query(
      "SELECT bookingId, customerId FROM booking WHERE bookingId = ?",
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookings[0];

    // Verify the booking belongs to the authenticated customer
    if (booking.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: "You can only access invoices for your own bookings",
      });
    }

    // Check if invoice exists for this booking
    const [invoices] = await db.query(
      "SELECT invoiceData FROM invoices WHERE bookingId = ? AND customerId = ?",
      [bookingId, customerId]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No invoice found for this booking. Invoice may not have been generated yet.",
      });
    }

    const invoiceData = JSON.parse(invoices[0].invoiceData);

    console.log("Retrieved stored invoice data for regeneration");

    // Generate PDF using the stored invoice data
    const htmlContent = generateInvoiceHTML(invoiceData);

    // Generate PDF using Puppeteer
    console.log("Regenerating PDF from stored invoice data...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Wait for web fonts to be fully loaded
    try {
      await page.evaluateHandle("document.fonts.ready");
    } catch (_) {}

    // Calculate dynamic scale to fit content into one A4 page height
    const contentHeight = await page.evaluate(() => document.body.scrollHeight);
    const mmToPx = (mm) => (mm * 96) / 25.4;
    const a4HeightPx = mmToPx(297);
    const marginMm = 12.7;
    const availableHeightPx = a4HeightPx - 2 * mmToPx(marginMm);
    let scale = 1;
    if (contentHeight > availableHeightPx) {
      scale = Math.max(0.1, Math.min(1, availableHeightPx / contentHeight));
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale,
      margin: {
        top: `${marginMm}mm`,
        right: `${marginMm}mm`,
        bottom: `${marginMm}mm`,
        left: `${marginMm}mm`,
      },
    });

    await browser.close();
    console.log("PDF regenerated successfully, size:", pdfBuffer.length);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${bookingId}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading customer invoice:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading invoice",
      error: error.message,
    });
  }
};

module.exports = {
  generateInvoice,
  getCustomerInvoices,
  downloadCustomerInvoice,
  finalizeInvoice,
};
