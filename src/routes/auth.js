const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Teacher, Student } = require('../models');  // ← Make sure Student is imported!

// ============================================================
// TEACHER ROUTES
// ============================================================

// Register a new teacher
router.post('/register-teacher', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingTeacher = await Teacher.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'A teacher with this email already exists'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const teacher = await Teacher.create({
      name,
      email,
      passwordHash
    });
    
    const token = jwt.sign(
      { id: teacher.id, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      data: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher',
        token
      }
    });
    
  } catch (error) {
    console.error('Teacher registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Teacher login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await Teacher.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { id: user.id, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'teacher',
        token
      }
    });
    
  } catch (error) {
    console.error('Teacher login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// ============================================================
// STUDENT ROUTES (ADD THESE BELOW)
// ============================================================

// Register a new student
router.post('/register-student', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
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
      passwordHash
    });
    
    // Generate token
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
        token
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
        token
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

module.exports = router;
