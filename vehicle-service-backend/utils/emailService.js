const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Must be false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
});

const sendEmail = async (to, subject, text, attachments = []) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    attachments,
  };

  try {
    console.log(
      `Sending email to ${to} with ${attachments.length} attachments...`
    );
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw error to prevent crashing if email fails, but maybe we should?
    // For now, let's log it. If email fails, the user won't get the password,
    // but the password was already changed in DB. This is a problem.
    // Ideally, we should send email first, or use a transaction, or revert change.
    // But for simplicity, let's throw so the controller can handle it (maybe revert).
    throw error;
  }
};

module.exports = sendEmail;
