router.post('/teacher-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const teacher = await Teacher.findOne({ where: { email } });

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ✅ Get the hash – works with either column name
    const hashToCompare = teacher.password_hash || teacher.password;

    if (!hashToCompare) {
      console.error('❌ Teacher record found but missing password hash in DB.');
      return res.status(500).json({
        success: false,
        message: 'Account authentication error'
      });
    }

    console.log('🔑 Hash present:', !!hashToCompare);

    // Check account status (optional)
    if (teacher.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, hashToCompare);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await teacher.update({ lastLogin: new Date() });

    // Generate JWT
    const token = jwt.sign(
      {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-me',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        role: 'teacher'
      }
    });

  } catch (error) {
    console.error('❌ Teacher login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});
