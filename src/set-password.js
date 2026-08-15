const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });  // load .env from root

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setPassword() {
  try {
    const email = 'arij@bespellbee.com';
    const plainPassword = 'Teacher123!';  // 👈 Change to your password

    // Generate hash
    const hash = await bcrypt.hash(plainPassword, 10);
    console.log('📝 Generated hash:', hash);

    // Update the teacher
    const result = await pool.query(
      'UPDATE teachers SET password = $1 WHERE email = $2 RETURNING id',
      [hash, email]
    );

    if (result.rowCount === 0) {
      console.error('❌ Teacher not found with email:', email);
      process.exit(1);
    }

    console.log(`✅ Password updated for ${email}`);
    console.log(`🔑 New password: ${plainPassword}`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

setPassword();
