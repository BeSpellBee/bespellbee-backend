const express = require('express');
const router = express.Router();
const { Student, Teacher, Lesson, Quiz, QuizAttempt, Activity } = require('../models');
const { authenticate } = require('../middleware/auth');

// ============================================================
// STUDENT ACTIVITY TRACKING
// ============================================================

// Track lesson view
router.post('/track/lesson-view', authenticate, async (req, res) => {
  try {
    const { studentId, lessonId, timeSpent, actionType } = req.body;
    
    if (!studentId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and lessonId are required'
      });
    }
    
    const activity = await Activity.create({
      studentId,
      lessonId,
      actionType: actionType || 'viewed',
      duration: timeSpent || 0,
      timestamp: new Date()
    });
    
    // Update lesson view count
    const lesson = await Lesson.findByPk(lessonId);
    if (lesson) {
      lesson.views = (lesson.views || 0) + 1;
      await lesson.save();
    }
    
    // Update student engagement score
    const student = await Student.findByPk(studentId);
    if (student) {
      student.engagementScore = parseFloat(student.engagementScore) + 0.5;
      await student.save();
    }
    
    return res.status(201).json({
      success: true,
      message: 'Activity tracked successfully',
      data: activity
    });
    
  } catch (error) {
    console.error('Track lesson view error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking lesson view'
    });
  }
});

// Track file open
router.post('/track/file-open', authenticate, async (req, res) => {
  try {
    const { studentId, fileName, fileType, durationViewed } = req.body;
    
    if (!studentId || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'studentId and fileName are required'
      });
    }
    
    const activity = await Activity.create({
      studentId,
      actionType: 'file_opened',
      metadata: { fileName, fileType, durationViewed },
      timestamp: new Date()
    });
    
    return res.status(201).json({
      success: true,
      message: 'File open tracked successfully',
      data: activity
    });
    
  } catch (error) {
    console.error('Track file open error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking file open'
    });
  }
});

// Track quiz attempt (with full question-level data)
router.post('/track/quiz-submit', authenticate, async (req, res) => {
  try {
    const { studentId, quizId, answers, score, timeTaken } = req.body;
    
    if (!studentId || !quizId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'studentId, quizId, and answers are required'
      });
    }
    
    // Get the quiz
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Create the quiz attempt
    const attempt = await QuizAttempt.create({
      studentId,
      quizId,
      answers,
      score,
      timeTaken: timeTaken || 0
    });
    
    // Update student engagement score
    const student = await Student.findByPk(studentId);
    if (student) {
      student.engagementScore = parseFloat(student.engagementScore) + 2;
      await student.save();
    }
    
    // Log the activity
    await Activity.create({
      studentId,
      lessonId: quiz.lessonId,
      actionType: 'quiz_completed',
      metadata: { quizId, score, timeTaken },
      timestamp: new Date()
    });
    
    return res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attemptId: attempt.id,
        score,
        totalQuestions: 1,
        percentage: score * 100
      }
    });
    
  } catch (error) {
    console.error('Quiz submit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error submitting quiz'
    });
  }
});

// Track generic activity (any action)
router.post('/track/activity', authenticate, async (req, res) => {
  try {
    const { studentId, lessonId, actionType, duration, metadata } = req.body;
    
    if (!studentId || !actionType) {
      return res.status(400).json({
        success: false,
        message: 'studentId and actionType are required'
      });
    }
    
    const activity = await Activity.create({
      studentId,
      lessonId: lessonId || null,
      actionType,
      duration: duration || 0,
      metadata: metadata || {},
      timestamp: new Date()
    });
    
    // Update student engagement score
    const student = await Student.findByPk(studentId);
    if (student) {
      student.engagementScore = parseFloat(student.engagementScore) + 0.2;
      await student.save();
    }
    
    return res.status(201).json({
      success: true,
      message: 'Activity tracked successfully',
      data: activity
    });
    
  } catch (error) {
    console.error('Track activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking activity'
    });
  }
});

// ============================================================
// TEACHER DATA RETRIEVAL
// ============================================================

// Get all students for a teacher
router.get('/teacher/students', authenticate, async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Get students (assuming a TeacherStudent join table)
    // For now, we'll return all students (you'll need to add the join)
    const students = await Student.findAll({
      attributes: ['id', 'name', 'email', 'engagementScore', 'lastLogin', 'createdAt']
    });
    
    // For each student, get their progress
    const studentData = await Promise.all(students.map(async (student) => {
      const activities = await Activity.findAll({
        where: { studentId: student.id },
        attributes: ['actionType', 'timestamp']
      });
      
      const quizAttempts = await QuizAttempt.findAll({
        where: { studentId: student.id },
        attributes: ['score', 'attemptDate']
      });
      
      const completedLessons = activities.filter(a => a.actionType === 'completed').length;
      const avgScore = quizAttempts.length > 0 
        ? quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length 
        : 0;
      
      return {
        ...student.toJSON(),
        completedLessons,
        avgScore,
        totalActivities: activities.length
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
      attributes: ['id', 'name', 'email', 'engagementScore', 'totalTimeSpent']
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Get all activities
    const activities = await Activity.findAll({
      where: { studentId },
      order: [['timestamp', 'DESC']],
      limit: 50
    });
    
    // Get all quiz attempts
    const quizAttempts = await QuizAttempt.findAll({
      where: { studentId },
      include: [
        {
          model: Quiz,
          attributes: ['id', 'question', 'correctAnswer']
        }
      ],
      order: [['attemptDate', 'DESC']]
    });
    
    // Calculate progress
    const completedLessons = activities.filter(a => a.actionType === 'completed').length;
    const avgScore = quizAttempts.length > 0 
      ? quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length 
      : 0;
    
    return res.status(200).json({
      success: true,
      data: {
        student,
        stats: {
          completedLessons,
          avgScore,
          totalQuizzes: quizAttempts.length,
          totalActivities: activities.length
        },
        recentActivities: activities,
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
// ADMIN ANALYTICS
// ============================================================

// Get platform analytics (admin only)
router.get('/admin/analytics', authenticate, async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalTeachers = await Teacher.count();
    const totalLessons = await Lesson.count();
    const totalQuizzes = await Quiz.count();
    const totalActivities = await Activity.count();
    const totalQuizAttempts = await QuizAttempt.count();
    
    // Get daily active students (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeStudents = await Activity.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT "studentId"')), 'count']
      ],
      where: {
        timestamp: {
          [sequelize.Op.gte]: sevenDaysAgo
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']]
    });
    
    // Get average quiz score
    const avgScore = await QuizAttempt.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalLessons,
        totalQuizzes,
        totalActivities,
        totalQuizAttempts,
        activeStudents: {
          daily: activeStudents,
          totalActive: activeStudents.length
        },
        avgQuizScore: parseFloat(avgScore[0].dataValues.avgScore) || 0
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
