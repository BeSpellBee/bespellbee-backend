
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Teacher, Student, StudentActivity } = require('../models');

// ============================================================
// TEACHER LOGIN (no registration – teachers are recruited by admin)
// ============================================================

router.post('/teacher-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find teacher
    const teacher = await Teacher.findOne({ where: { email } });

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if teacher is active (optional, but recommended)
    if (teacher.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password – using 'password' field (not 'passwordHash')
    const isValidPassword = await bcrypt.compare(password, teacher.password);

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

    // Track login activity (optional – for analytics)
    await StudentActivity.create({
      studentId: null,
      teacherId: teacher.id,
      activityType: 'teacher_login',
      activityData: {
        email: teacher.email,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject || null,
        role: 'teacher',
        token
      }
    });

  } catch (error) {
    console.error('❌ Teacher login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================
// REMOVE OR DISABLE TEACHER REGISTRATION (for security)
// ============================================================

// If you need to add teachers manually, create a separate admin route
// or run a script to insert teachers directly into the database.

// Example script to add a teacher (run once via Node):
/*
const bcrypt = require('bcryptjs');
const { Teacher } = require('./models');

async function addTeacher() {
  const password = await bcrypt.hash('your-password', 10);
  await Teacher.create({
    name: 'Teacher Name',
    email: 'teacher@example.com',
    password: password,
    subject: 'English',
    isActive: true
  });
  console.log('✅ Teacher added');
}
addTeacher();
*/

module.exports = router;

// ============================================================
// STUDENT ROUTES
// ============================================================

// Register a new student
router.post('/register-student', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }
    
    // Check if student already exists
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A student with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create student
    const student = await Student.create({
      name,
      email,
      passwordHash,
      phone: phone || null,
      engagementScore: 0,
      totalTimeSpent: 0
    });
    
    // Generate JWT
    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'student',
        token,
        engagementScore: 0
      }
    });
    
  } catch (error) {
    console.error('Student registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Student login
router.post('/student-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find student
    const student = await Student.findOne({ where: { email } });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, student.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update last login
    student.lastLogin = new Date();
    await student.save();
    
    // Generate JWT
    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'student',
        token,
        engagementScore: student.engagementScore || 0
      }
    });
    
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// ============================================================
// GET STUDENT PROFILE (Protected)
// ============================================================

router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student only.'
      });
    }
    
    const student = await Student.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'phone', 'engagementScore', 'totalTimeSpent', 'createdAt']
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: student
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

module.exports = router;
