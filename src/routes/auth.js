const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Teacher, Student, StudentActivity, Booking } = require('../models');
const { authenticate } = require('../middleware/auth');

// ============================================================
// STUDENT ROUTES
// ============================================================

// Register a new student
router.post('/register-student', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }
    
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A student with this email already exists'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const student = await Student.create({
      name,
      email,
      passwordHash,
      phone: phone || null,
      engagementScore: 0,
      totalTimeSpent: 0
    });
    
    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key-change-me',
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
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const student = await Student.findOne({ where: { email } });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, student.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    student.lastLogin = new Date();
    await student.save();
    
    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key-change-me',
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
// TEACHER LOGIN (no signup – recruited by admin)
// ============================================================

// Teacher login route
router.post('/teacher-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    
    const teacher = await Teacher.findOne({
      where: { email },
    
    });

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Access the hash via teacher.password_hash or teacher.passwordHash
    const hashToCompare = teacher.password_hash || teacher.passwordHash || teacher.password;

    console.log('✅ Teacher found:', teacher.email);
    console.log('🔑 Password hash present:', !!hashToCompare);

    if (!teacher.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, hashToCompare);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    await teacher.update({ lastLogin: new Date() });

    const token = jwt.sign(
      { id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher' },
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

// ============================================================
// GET STUDENT PROFILE
// ============================================================

router.get('/profile', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student only.'
      });
    }
    
    const student = await Student.findByPk(req.user.id, {
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

// ============================================================
// GET TEACHER DASHBOARD DATA
// ============================================================

router.get('/teacher/dashboard', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher only.'
      });
    }

    const teacherId = req.user.id;

    const teacher = await Teacher.findByPk(teacherId, {
      attributes: ['id', 'name', 'email', 'subject', 'bio']
    });

    const bookings = await Booking.findAll({
      where: { teacherName: teacher.name },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const recentActivity = await StudentActivity.findAll({
      where: {
        activityType: ['link_click', 'page_view', 'carousel_view']
      },
      order: [['createdAt', 'DESC']],
      limit: 30,
      include: [
        { model: Student, attributes: ['id', 'name', 'email'] }
      ]
    });

    const engagementStats = await StudentActivity.findAll({
      attributes: [
        'studentId',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'activityCount']
      ],
      where: {
        activityType: ['link_click', 'page_view', 'carousel_view']
      },
      group: ['studentId'],
      order: [[require('sequelize').literal('activityCount'), 'DESC']],
      limit: 10,
      include: [
        { model: Student, attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.status(200).json({
      success: true,
      data: {
        teacher,
        stats: {
          totalBookings: bookings.length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length,
          totalStudents: engagementStats.length,
          recentActivityCount: recentActivity.length
        },
        recentActivity,
        engagementStats,
        bookings: bookings.slice(0, 10)
      }
    });

 } catch (error) {
  console.error('❌ Teacher login error:', error);  // <-- this logs to Render
  return res.status(500).json({
    success: false,
    message: 'Server error during login',
    error: error.message,   // <-- send the actual error to frontend
    stack: error.stack      // optional, but helpful
  });
}
});

module.exports = router;
