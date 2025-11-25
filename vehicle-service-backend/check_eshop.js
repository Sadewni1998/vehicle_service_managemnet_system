import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkEshopTable() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [rows] = await conn.execute('SHOW TABLES LIKE "eshop"');
    console.log('Eshop table exists:', rows.length > 0);

    if (rows.length > 0) {
      const [data] = await conn.execute('SELECT COUNT(*) as count FROM eshop');
      console.log('Eshop records:', data[0].count);

      // Show sample data
      const [sample] = await conn.execute('SELECT * FROM eshop LIMIT 3');
      console.log('Sample data:', sample);
    }

    conn.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEshopTable();