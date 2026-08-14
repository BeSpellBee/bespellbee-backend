const bcrypt = require('bcryptjs');
const fs = require('fs');

const password = 'MyNewPassword123';  // ← Change this to your password

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('✅ Hash generated:');
    console.log(hash);
    fs.writeFileSync('hash-output.txt', hash);
    console.log('✅ Hash also saved to hash-output.txt');
});
