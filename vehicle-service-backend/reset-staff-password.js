const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function resetStaffPassword(email, newPassword) {
  try {
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password in database
    const [result] = await db.query(
      'UPDATE staff SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    
    if (result.affectedRows > 0) {
      console.log(`Password reset successfully for ${email}`);
      console.log(`New password: ${newPassword}`);
      console.log(`Hashed password: ${hashedPassword}`);
    } else {
      console.log(`No staff member found with email: ${email}`);
    }
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    process.exit(0);
  }
}

// Usage: node reset-staff-password.js
// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node reset-staff-password.js <email> <new-password>');
  console.log('Example: node reset-staff-password.js john.smith@vehicleservice.com newpassword123');
  process.exit(1);
}

resetStaffPassword(email, newPassword);
