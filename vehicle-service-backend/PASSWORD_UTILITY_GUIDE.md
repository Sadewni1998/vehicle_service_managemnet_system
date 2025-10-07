# Password Utility Usage Guide

## Overview
The `passwordUtility.js` file provides secure password hashing and verification using bcrypt.

## Installation
bcryptjs is already installed in your project dependencies. No additional installation needed.

## Quick Start Examples

### Generate Test Passwords
```bash
node generatePasswords.js
```
This will generate hashed passwords for common roles in your system.

### Hash a Single Password
```bash
node passwordUtility.js interactive
# Choose option 1, enter your password
```

### Verify a Password
```bash
node passwordUtility.js interactive  
# Choose option 2, enter plain password and hash
```

## Usage Methods

### 1. Interactive Mode (Recommended for manual use)
```bash
node passwordUtility.js interactive
```
This starts an interactive CLI where you can:
- Hash passwords for database storage
- Verify passwords against hashes
- Easy-to-use menu system

### 2. Test Mode (For testing functionality)
```bash
node passwordUtility.js test
```
Runs automated tests to verify all functions work correctly.

### 3. Module Import (For use in other files)
```javascript
const { hashPassword, verifyPassword } = require('./passwordUtility');

// Hash a password
const hashedPassword = await hashPassword('myPassword123');

// Verify a password
const isValid = await verifyPassword('myPassword123', hashedPassword);
```

## Examples

### Hash a Password
```javascript
const passwordUtil = require('./passwordUtility');

async function example() {
  const plainPassword = 'userPassword123';
  const hashedPassword = await passwordUtil.hashPassword(plainPassword);
  console.log('Hashed:', hashedPassword);
  // Output: $2b$10$abcd1234... (always different due to salt)
}
```

### Verify a Password
```javascript
async function verifyExample() {
  const plainPassword = 'userPassword123';
  const hashedFromDB = '$2b$10$abcd1234...'; // From database
  
  const isMatch = await passwordUtil.verifyPassword(plainPassword, hashedFromDB);
  console.log('Password valid:', isMatch); // true or false
}
```

### Batch Hash Multiple Passwords
```javascript
async function batchExample() {
  const passwords = ['admin123', 'user456', 'guest789'];
  const results = await passwordUtil.hashMultiplePasswords(passwords);
  
  results.forEach(result => {
    console.log(`${result.original} -> ${result.hashed}`);
  });
}
```

## Integration with Your Vehicle Service System

### In Authentication Controller
```javascript
const { hashPassword, verifyPassword } = require('../passwordUtility');

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await hashPassword(password);
    
    // Save to database
    await db.query(
      'INSERT INTO customer (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from database
    const [users] = await db.query(
      'SELECT * FROM customer WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token and send response
    res.json({ message: 'Login successful', user: { id: user.customerId, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Security Notes

✅ **Uses bcrypt**: Industry standard for password hashing
✅ **Salt rounds**: 10 rounds (recommended for production)
✅ **Async operations**: Non-blocking password operations
✅ **Error handling**: Proper error catching and logging
✅ **Input validation**: Checks for required parameters

## Commands Quick Reference

```bash
# Interactive password tool
node passwordUtility.js interactive

# Run tests
node passwordUtility.js test

# Show help
node passwordUtility.js
```

## File Location
`/vehicle-service-backend/passwordUtility.js`