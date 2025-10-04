// controllers/contactController.js

const db = require("../config/db");

/**
 * Handles saving a new submission from the contact form.
 */
const submitContactForm = async (req, res) => {
  // Get the details from the request body
  const { name, email, subject, message } = req.body;

  // Basic validation to ensure required fields are present
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ message: "Name, email, and message are required." });
  }

  try {
    const sql = `
      INSERT INTO contact_submissions (name, email, subject, message) 
      VALUES (?, ?, ?, ?)
    `;
    const values = [name, email, subject, message];

    const [result] = await db.query(sql, values);

    res.status(201).json({
      message:
        "Your message has been submitted successfully! We will get back to you soon.",
      submissionId: result.insertId,
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    res
      .status(500)
      .json({ message: "Server error while submitting your message." });
  }
};

module.exports = {
  submitContactForm,
};
