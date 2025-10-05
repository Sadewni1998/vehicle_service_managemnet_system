const db = require('./config/db');

async function updateBreakdownTable() {
  try {
    console.log('🔧 Updating breakdown_request table for public access...');
    
    // Add new columns for public requests
    const alterQueries = [
      'ALTER TABLE breakdown_request ADD COLUMN contactName VARCHAR(255) NULL',
      'ALTER TABLE breakdown_request ADD COLUMN contactPhone VARCHAR(20) NULL',
      'ALTER TABLE breakdown_request ADD COLUMN vehicleNumber VARCHAR(100) NULL',
      'ALTER TABLE breakdown_request ADD COLUMN vehicleType VARCHAR(100) NULL',
      'ALTER TABLE breakdown_request MODIFY COLUMN customerId INT NULL',
      'ALTER TABLE breakdown_request MODIFY COLUMN vehicleId INT NULL'
    ];
    
    for (const query of alterQueries) {
      try {
        await db.query(query);
        console.log('✅ Executed:', query);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️  Column already exists, skipping...');
        } else {
          console.log('⚠️  Error executing query:', query, error.message);
        }
      }
    }
    
    console.log('🎉 Database update complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

updateBreakdownTable();
