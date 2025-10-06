const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStaffTable() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vehicle_service_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Connected to database successfully!');
    console.log('👥 Checking staff table...\n');

    // Check if staff table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'staff'"
    );

    if (tables.length === 0) {
      console.log('❌ Staff table does not exist!');
      return;
    }

    console.log('✅ Staff table exists!');

    // Get staff table structure
    const [columns] = await connection.execute('DESCRIBE staff');
    console.log('\n📋 Staff Table Structure:');
    console.log('='.repeat(80));
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(20)} | ${col.Type.padEnd(15)} | ${col.Null.padEnd(3)} | ${col.Key.padEnd(3)} | ${col.Default || 'NULL'}`);
    });

    // Get all staff members
    const [staff] = await connection.execute('SELECT * FROM staff');
    console.log(`\n👥 Total staff members: ${staff.length}`);
    
    if (staff.length > 0) {
      console.log('\n📝 Staff members:');
      console.log('='.repeat(80));
      staff.forEach(member => {
        console.log(`ID: ${member.staffId} | Name: ${member.name} | Email: ${member.email} | Role: ${member.role}`);
      });

      // Check specifically for mechanic
      const [mechanics] = await connection.execute(
        "SELECT * FROM staff WHERE role = 'mechanic'"
      );
      
      console.log(`\n🔧 Mechanics found: ${mechanics.length}`);
      if (mechanics.length > 0) {
        console.log('Mechanic details:');
        mechanics.forEach(mechanic => {
          console.log(`  - ID: ${mechanic.staffId}`);
          console.log(`  - Name: ${mechanic.name}`);
          console.log(`  - Email: ${mechanic.email}`);
          console.log(`  - Role: ${mechanic.role}`);
          console.log(`  - Password hash: ${mechanic.password.substring(0, 20)}...`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkStaffTable();
