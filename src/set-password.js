const bcrypt = require('bcryptjs');
const { Teacher } = require('./models'); // adjust path if needed

async function run() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);
  
  const teacher = await Teacher.findOne({ where: { email: 'arij@bespellbee.com' } });
  if (!teacher) {
    console.log('Teacher not found');
    return;
  }
  
  // Set password on whichever field exists on your model
  if ('password_hash' in teacher) {
    teacher.password_hash = hashedPassword;
  } else if ('password' in teacher) {
    teacher.password = hashedPassword;
  } else {
    teacher.passwordHash = hashedPassword;
  }

  await teacher.save();
  console.log('✅ Password successfully updated for arij@bespellbee.com to "Password123!"');
  process.exit(0);
}

run().catch(console.error);
