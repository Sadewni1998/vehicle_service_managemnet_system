const bcrypt = require('bcryptjs');

/**
 * Password Utility Module
 * Provides secure password hashing and verification using bcrypt
 */

// Number of salt rounds for bcrypt (10 is recommended for production)
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {string} plainPassword - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
async function hashPassword(plainPassword) {
  try {
    if (!plainPassword) {
      throw new Error('Password is required');
    }
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    console.log('✅ Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    console.error('❌ Error hashing password:', error.message);
    throw error;
  }
}

/**
 * Verify a plain text password against a hashed password
 * @param {string} plainPassword - The plain text password to verify
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    if (!plainPassword || !hashedPassword) {
      throw new Error('Both plain password and hashed password are required');
    }
    
    console.log('🔍 Verifying password...');
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(isMatch ? '✅ Password verified successfully' : '❌ Password verification failed');
    return isMatch;
  } catch (error) {
    console.error('❌ Error verifying password:', error.message);
    throw error;
  }
}

/**
 * Batch hash multiple passwords
 * @param {string[]} passwords - Array of plain text passwords
 * @returns {Promise<Object[]>} - Array of objects with original and hashed passwords
 */
async function hashMultiplePasswords(passwords) {
  try {
    console.log(`🔐 Hashing ${passwords.length} passwords...`);
    const results = [];
    
    for (let i = 0; i < passwords.length; i++) {
      const original = passwords[i];
      const hashed = await hashPassword(original);
      results.push({
        index: i + 1,
        original: original,
        hashed: hashed
      });
    }
    
    console.log('✅ All passwords hashed successfully');
    return results;
  } catch (error) {
    console.error('❌ Error hashing multiple passwords:', error.message);
    throw error;
  }
}

/**
 * Interactive CLI function for password operations
 */
async function interactivePasswordTool() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log('\n🔐 Password Hash Utility Tool');
    console.log('==============================');
    console.log('1. Hash a password');
    console.log('2. Verify a password');
    console.log('3. Exit');
    
    const choice = await question('\nChoose an option (1-3): ');
    
    switch (choice) {
      case '1':
        const passwordToHash = await question('Enter password to hash: ');
        const hashed = await hashPassword(passwordToHash);
        console.log('\n📋 Results:');
        console.log('Original Password:', passwordToHash);
        console.log('Hashed Password:', hashed);
        console.log('\n💡 Copy the hashed password for database storage.');
        break;
        
      case '2':
        const plainPwd = await question('Enter plain password: ');
        const hashedPwd = await question('Enter hashed password: ');
        const isValid = await verifyPassword(plainPwd, hashedPwd);
        console.log('\n📋 Verification Result:', isValid ? '✅ MATCH' : '❌ NO MATCH');
        break;
        
      case '3':
        console.log('👋 Goodbye!');
        rl.close();
        return;
        
      default:
        console.log('❌ Invalid option');
        break;
    }
    
    const continueChoice = await question('\nContinue? (y/n): ');
    if (continueChoice.toLowerCase() === 'y') {
      await interactivePasswordTool();
    } else {
      console.log('👋 Goodbye!');
    }
    
  } catch (error) {
    console.error('❌ Error in interactive tool:', error.message);
  } finally {
    rl.close();
  }
}

/**
 * Example usage and testing
 */
async function testPasswordUtility() {
  try {
    console.log('\n🧪 Testing Password Utility Functions');
    console.log('=====================================');
    
    // Test single password hashing
    const testPassword = 'mySecretPassword123';
    console.log('\n1. Testing single password hash:');
    const hashed = await hashPassword(testPassword);
    console.log('Original:', testPassword);
    console.log('Hashed:', hashed);
    
    // Test password verification
    console.log('\n2. Testing password verification:');
    const isValidCorrect = await verifyPassword(testPassword, hashed);
    const isValidWrong = await verifyPassword('wrongPassword', hashed);
    console.log('Correct password verification:', isValidCorrect);
    console.log('Wrong password verification:', isValidWrong);
    
    // Test multiple passwords
    console.log('\n3. Testing multiple password hashing:');
    const multiplePasswords = ['password1', 'admin123', 'user456'];
    const hashedResults = await hashMultiplePasswords(multiplePasswords);
    console.table(hashedResults);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Export functions for use in other modules
module.exports = {
  hashPassword,
  verifyPassword,
  hashMultiplePasswords,
  interactivePasswordTool,
  testPasswordUtility
};

// If this file is run directly, start the interactive tool
if (require.main === module) {
  console.log('🔐 Password Hash Utility');
  console.log('Choose run mode:');
  console.log('node passwordUtility.js interactive - Run interactive mode');
  console.log('node passwordUtility.js test - Run test mode');
  
  const mode = process.argv[2];
  
  if (mode === 'interactive') {
    interactivePasswordTool();
  } else if (mode === 'test') {
    testPasswordUtility();
  } else {
    console.log('\n📚 Available functions:');
    console.log('- hashPassword(plainText) - Hash a password');
    console.log('- verifyPassword(plain, hashed) - Verify a password');
    console.log('- hashMultiplePasswords(array) - Hash multiple passwords');
    console.log('- interactivePasswordTool() - Interactive CLI tool');
    console.log('- testPasswordUtility() - Run tests');
    console.log('\n💡 Usage examples:');
    console.log('node passwordUtility.js interactive');
    console.log('node passwordUtility.js test');
  }
}