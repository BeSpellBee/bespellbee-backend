const express = require('express');
const router = express.Router();
const { Student, Teacher, Lesson, Quiz, QuizAttempt } = require('../models');
const { authenticate } = require('../middleware/auth');

// ============================================================
// TEACHER DATA RETRIEVAL
// ============================================================

// Get all students for a teacher
router.get('/teacher/students', authenticate, async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: ['id', 'name', 'email', 'engagementScore', 'lastLogin', 'createdAt']
    });
    
    // Get quiz stats for each student
    const studentData = await Promise.all(students.map(async (student) => {
      const quizAttempts = await QuizAttempt.findAll({
        where: { studentId: student.id },
        attributes: ['score', 'attemptDate']
      });
      
      const avgScore = quizAttempts.length > 0 
        ? quizAttempts.reduce((sum, q) => sum + parseFloat(q.score || 0), 0) / quizAttempts.length 
        : 0;
      
      return {
        ...student.toJSON(),
        totalQuizzes: quizAttempts.length,
        avgScore: Math.round(avgScore * 100) / 100
      };
    }));
    
    return res.status(200).json({
      success: true,
      data: studentData
    });
    
  } catch (error) {
    console.error('Get teacher students error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching students'
    });
  }
});

// Get student progress detail for a teacher
router.get('/teacher/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'name', 'email', 'engagementScore', 'totalTimeSpent', 'createdAt']
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get quiz attempts
    const quizAttempts = await QuizAttempt.findAll({
      where: { studentId },
      order: [['attemptDate', 'DESC']],
      limit: 20
    });
    
    const avgScore = quizAttempts.length > 0 
      ? quizAttempts.reduce((sum, q) => sum + parseFloat(q.score || 0), 0) / quizAttempts.length 
      : 0;
    
    return res.status(200).json({
      success: true,
      data: {
        student,
        stats: {
          avgScore: Math.round(avgScore * 100) / 100,
          totalQuizzes: quizAttempts.length,
          totalTimeSpent: student.totalTimeSpent || 0,
          engagementScore: student.engagementScore || 0
        },
        quizHistory: quizAttempts
      }
    });
    
  } catch (error) {
    console.error('Get student detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching student details'
    });
  }
});

// ============================================================
// ADMIN ANALYTICS (Simplified)
// ============================================================

router.get('/admin/analytics', authenticate, async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalTeachers = await Teacher.count();
    const totalLessons = await Lesson.count();
    const totalQuizzes = await Quiz.count();
    const totalQuizAttempts = await QuizAttempt.count();
    
    // Get average quiz score
    const avgScoreResult = await QuizAttempt.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
      ]
    });
    
    const avgScore = avgScoreResult.length > 0 
      ? parseFloat(avgScoreResult[0].dataValues.avgScore) || 0 
      : 0;
    
    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalLessons,
        totalQuizzes,
        totalQuizAttempts,
        avgQuizScore: Math.round(avgScore * 100) / 100
      }
    });
    
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});

module.exports = router;
