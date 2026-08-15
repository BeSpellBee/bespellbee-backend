const bcrypt = require('bcryptjs');
const { Teacher } = require('./models');

async function setTeacherPassword() {
  const email = 'arij@bespellbee.com';
  const plainPassword = 'Password123!';

  try {
    console.log(`🔍 Locating teacher account: ${email}...`);
    const teacher = await Teacher.findOne({ where: { email } });

    if (!teacher) {
      console.error(`❌ Teacher with email "${email}" was not found in the database.`);
      process.exit(1);
    }

    console.log('✅ Teacher found!');
    console.log('🔍 Available model fields:', Object.keys(teacher.toJSON()));

    // Generate valid bcrypt hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Update whichever password field exists on your model
    if ('password_hash' in teacher) {
      teacher.password_hash = hashedPassword;
    } else if ('password' in teacher) {
      teacher.password = hashedPassword;
    } else if ('passwordHash' in teacher) {
      teacher.passwordHash = hashedPassword;
    } else {
      // Fallback: set password_hash directly
      teacher.set('password_hash', hashedPassword);
    }

    await teacher.save();

    console.log('====================================================');
    console.log('🎉 SUCCESS: Password updated successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${plainPassword}`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting teacher password:', error);
    process.exit(1);
  }
}

setTeacherPassword();
