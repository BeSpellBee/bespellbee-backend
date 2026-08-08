const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Teacher } = require('../models');

// Register a new teacher
router.post('/register-teacher', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'A teacher with this email already exists'
      });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create the teacher
    const teacher = await Teacher.create({
      name,
      email,
      passwordHash
    });
    
    // Generate JWT token
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
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Try to find a teacher with this email
    let user = await Teacher.findOne({ where: { email } });
    let role = 'teacher';
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: role },
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
        role: role,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

module.exports = router;
