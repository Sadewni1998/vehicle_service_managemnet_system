const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function checkAndInsertServiceAdvisor() {
  try {
    const email = 'service_advicer@vehicleservice.com';
    const password = 'serviceadvisor123';
    const name = 'Service Advisor';
    const role = 'service_advisor';

    // Check if service advisor already exists
    const [existingStaff] = await db.query(
      'SELECT * FROM staff WHERE email = ?',
      [email]
    );

    if (existingStaff.length > 0) {
      console.log('Service advisor already exists:');
      console.log('Email:', existingStaff[0].email);
      console.log('Name:', existingStaff[0].name);
      console.log('Role:', existingStaff[0].role);
      console.log('Password hash:', existingStaff[0].password);
      
      // Test if the password works
      const isMatch = await bcrypt.compare(password, existingStaff[0].password);
      console.log('Password test result:', isMatch ? 'PASSWORD CORRECT' : 'PASSWORD INCORRECT');
      
      if (!isMatch) {
        console.log('Updating password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await db.query(
          'UPDATE staff SET password = ? WHERE email = ?',
          [hashedPassword, email]
        );
        
        console.log('Password updated successfully!');
        console.log('New password hash:', hashedPassword);
      }
    } else {
      console.log('Service advisor does not exist. Creating new one...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insert new service advisor
      const [result] = await db.query(
        'INSERT INTO staff (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      
      console.log('Service advisor created successfully!');
      console.log('Staff ID:', result.insertId);
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Password hash:', hashedPassword);
    }

    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    const [finalCheck] = await db.query(
      'SELECT staffId, name, email, role FROM staff WHERE email = ?',
      [email]
    );
    
    if (finalCheck.length > 0) {
      console.log('✅ Service advisor found in database:');
      console.log('Staff ID:', finalCheck[0].staffId);
      console.log('Name:', finalCheck[0].name);
      console.log('Email:', finalCheck[0].email);
      console.log('Role:', finalCheck[0].role);
      console.log('\n🔐 Login Credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.log('❌ Service advisor not found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndInsertServiceAdvisor();
