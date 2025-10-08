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
      `SELECT b.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail
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
          const partIds = spareParts.map(sp => sp.partId);
          const placeholders = partIds.map(() => "?").join(",");
          const [parts] = await db.query(
            `SELECT partId, partName, partCode, category, unitPrice 
             FROM spareparts 
             WHERE partId IN (${placeholders})`,
            partIds
          );
          
          assignedSparePartsDetails = parts.map(part => {
            const assignedPart = spareParts.find(sp => sp.partId === part.partId);
            return {
              ...part,
              assignedQuantity: assignedPart ? assignedPart.quantity : 1,
              totalPrice: part.unitPrice * (assignedPart ? assignedPart.quantity : 1)
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
        serviceTypes = booking.serviceTypes.split(',').map(s => s.trim());
      }
    }

    // Calculate totals
    const laborCost = assignedMechanicsDetails.reduce((total, mechanic) => {
      return total + (mechanic.hourlyRate || 0);
    }, 0);

    const partsCost = assignedSparePartsDetails.reduce((total, part) => {
      return total + (part.totalPrice || 0);
    }, 0);

    const subtotal = laborCost + partsCost;
    const taxRate = 0.15; // 15% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: `INV-${bookingId}-${Date.now()}`,
      invoiceDate: new Date().toLocaleDateString(),
      bookingId: bookingId,
      customer: {
        name: booking.customerName || booking.name,
        phone: booking.customerPhone || booking.phone,
        email: booking.customerEmail || 'N/A'
      },
      vehicle: {
        number: booking.vehicleNumber,
        type: booking.vehicleType,
        brand: booking.vehicleBrand,
        model: booking.vehicleBrandModel,
        year: booking.manufacturedYear,
        fuelType: booking.fuelType,
        transmission: booking.transmissionType
      },
      service: {
        date: new Date(booking.bookingDate).toLocaleDateString(),
        timeSlot: booking.timeSlot,
        types: serviceTypes,
        specialRequests: booking.specialRequests
      },
      mechanics: assignedMechanicsDetails,
      parts: assignedSparePartsDetails,
      pricing: {
        laborCost: laborCost,
        partsCost: partsCost,
        subtotal: subtotal,
        tax: tax,
        total: total
      }
    };

    console.log("Invoice data prepared:", invoiceData);

    // Generate HTML for the invoice
    const htmlContent = generateInvoiceHTML(invoiceData);

    // Generate PDF using Puppeteer
    console.log("Starting PDF generation with Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();
    console.log("PDF generated successfully, size:", pdfBuffer.length);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${bookingId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ 
      message: "Error generating invoice", 
      error: error.message 
    });
  }
};

/**
 * Generate HTML content for the invoice
 */
const generateInvoiceHTML = (data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Service Invoice - ${data.invoiceNumber}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #000;
                line-height: 1.4;
                background: white;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #000;
            }
            .logo-container {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 10px;
            }
            .logo {
                width: 50px;
                height: 50px;
                margin-right: 10px;
            }
            .company-name {
                color: #dc2626;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }
            .company-address {
                color: #000;
                font-size: 14px;
                margin: 5px 0 0 0;
            }
            .main-content {
                display: flex;
                gap: 40px;
                margin-bottom: 30px;
            }
            .left-column, .right-column {
                flex: 1;
            }
            .section {
                margin-bottom: 25px;
            }
            .section h3 {
                color: #000;
                margin: 0 0 10px 0;
                font-size: 16px;
                font-weight: bold;
            }
            .field {
                margin-bottom: 5px;
                font-size: 14px;
                color: #000;
            }
            .field strong {
                font-weight: bold;
            }
            .cost-details {
                margin-top: 30px;
            }
            .cost-details h3 {
                color: #000;
                margin: 0 0 15px 0;
                font-size: 16px;
                font-weight: bold;
            }
            .cost-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
            }
            .cost-table td {
                border: 1px solid #000;
                padding: 10px;
                font-size: 14px;
                color: #000;
            }
            .cost-table td:last-child {
                text-align: right;
            }
            .total-row {
                font-weight: bold;
            }
            .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #000;
                text-align: center;
                color: #000;
                font-size: 12px;
            }
            .footer p {
                margin: 3px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo-container">
                <img src="data:image/png;base64,${getLogoBase64()}" alt="Logo" class="logo">
                <h1 class="company-name">Hybrid Lanka</h1>
            </div>
            <p class="company-address">134/3 Horana road, Kesbewa, Sri Lanka</p>
        </div>

        <div class="main-content">
            <div class="left-column">
                <div class="section">
                    <h3>Invoice Details</h3>
                    <div class="field"><strong>Invoice Number:</strong> ${data.invoiceNumber}</div>
                    <div class="field"><strong>Invoice Date:</strong> ${data.invoiceDate}</div>
                    <div class="field"><strong>Booking ID:</strong> ${data.bookingId}</div>
                </div>

                <div class="section">
                    <h3>Vehicle Information</h3>
                    <div class="field"><strong>Vehicle Number:</strong> ${data.vehicle.number}</div>
                    <div class="field"><strong>Type:</strong> ${data.vehicle.type}</div>
                    <div class="field"><strong>Brand & Model:</strong> ${data.vehicle.brand} ${data.vehicle.model}</div>
                    <div class="field"><strong>Year:</strong> ${data.vehicle.year}</div>
                    <div class="field"><strong>Fuel Type:</strong> ${data.vehicle.fuelType}</div>
                    <div class="field"><strong>Transmission:</strong> ${data.vehicle.transmission}</div>
                </div>
            </div>

            <div class="right-column">
                <div class="section">
                    <h3>Customer Information</h3>
                    <div class="field"><strong>Name:</strong> ${data.customer.name}</div>
                    <div class="field"><strong>Phone:</strong> ${data.customer.phone}</div>
                    <div class="field"><strong>Email:</strong> ${data.customer.email}</div>
                </div>

                <div class="section">
                    <h3>Service Details Service</h3>
                    <div class="field"><strong>Date:</strong> ${data.service.date}</div>
                    <div class="field"><strong>Time Slot:</strong> ${data.service.timeSlot}</div>
                    <div class="field"><strong>Service Types:</strong> ${data.service.types.join(', ')}</div>
                    ${data.service.specialRequests ? `<div class="field"><strong>Special Requests:</strong> ${data.service.specialRequests}</div>` : ''}
                    ${data.parts.length > 0 ? `<div class="field"><strong>Spare parts used:</strong> ${data.parts.map(part => `${part.partName} (${part.assignedQuantity})`).join(', ')}</div>` : ''}
                </div>
            </div>
        </div>

        <div class="cost-details">
            <h3>Cost Details</h3>
            <table class="cost-table">
                <tbody>
                    <tr>
                        <td>Labor Cost</td>
                        <td>Rs. ${data.pricing.laborCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr>
                        <td>Parts Cost</td>
                        <td>Rs. ${data.pricing.partsCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr>
                        <td>Subtotal</td>
                        <td>Rs. ${data.pricing.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr>
                        <td>Tax (15%)</td>
                        <td>Rs. ${data.pricing.tax.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Amount</td>
                        <td>Rs. ${data.pricing.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Thank you for choosing our service!</p>
            <p>For any queries, please contact us at hybridlanka.com.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
  `;
};

/**
 * Get logo as base64 string
 */
const getLogoBase64 = () => {
  try {
    // Path to the logo file in the public directory
    const logoPath = path.join(__dirname, '../../public/logo.png');
    
    console.log('Looking for logo at:', logoPath);
    
    // Check if logo file exists
    if (fs.existsSync(logoPath)) {
      // Read the logo file and convert to base64
      const logoBuffer = fs.readFileSync(logoPath);
      console.log('Logo file found and read successfully, size:', logoBuffer.length);
      return logoBuffer.toString('base64');
    } else {
      console.log('Logo file not found at:', logoPath);
      // Try alternative path
      const altPath = path.join(__dirname, '../public/logo.png');
      if (fs.existsSync(altPath)) {
        const logoBuffer = fs.readFileSync(altPath);
        console.log('Logo file found at alternative path:', altPath);
        return logoBuffer.toString('base64');
      }
      return '';
    }
  } catch (error) {
    console.error('Error reading logo file:', error);
    return '';
  }
};

module.exports = {
  generateInvoice
};
