const { hashPassword } = require('./passwordUtility');

/**
 * Example: Hash common passwords for your vehicle service system
 * Run this script to generate hashed passwords for testing/admin accounts
 */

async function generateCommonPasswords() {
  console.log('🔐 Generating Hashed Passwords for Vehicle Service System');
  console.log('========================================================\n');

  const commonPasswords = [
    { role: 'Admin', password: 'admin123' },
    { role: 'Manager', password: 'manager123' },
    { role: 'Mechanic', password: 'mechanic123' },
    { role: 'Receptionist', password: 'reception123' },
    { role: 'Service Advisor', password: 'advisor123' },
    { role: 'Test User', password: 'test123' }
  ];

  console.log('📋 Password Hashes for Database:\n');
  
  for (const user of commonPasswords) {
    try {
      const hashedPassword = await hashPassword(user.password);
      console.log(`${user.role}:`);
      console.log(`  Original: ${user.password}`);
      console.log(`  Hashed: ${hashedPassword}`);
      console.log(`  SQL: UPDATE staff SET password = '${hashedPassword}' WHERE role = '${user.role.toLowerCase()}';`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error hashing password for ${user.role}:`, error.message);
    }
  }

  console.log('💡 Copy the hashed passwords above to update your database securely!');
  console.log('💡 You can also use the interactive mode: node passwordUtility.js interactive');
}

// Run the function if this file is executed directly
if (require.main === module) {
  generateCommonPasswords();
}

module.exports = { generateCommonPasswords };