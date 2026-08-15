const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/models');  // adjust path if needed

async function setPassword() {
  try {
    const email = 'arij@bespellbee.com';
    const plainPassword = 'Teacher123!';  // 👈 CHANGE THIS to your password

    // Generate hash
    const hash = await bcrypt.hash(plainPassword, 10);
    console.log('📝 Generated hash:', hash);

    // Update the teacher
    await sequelize.query(
      `UPDATE teachers SET password = :hash WHERE email = :email`,
      {
        replacements: { hash, email },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log(`✅ Password updated for ${email}`);
    console.log(`🔑 New password: ${plainPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setPassword();
