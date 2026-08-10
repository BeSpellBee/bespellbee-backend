const express = require('express');
const router = express.Router();
const {
  LessonView,
  VideoTracking,
  FileTracking,
  QuizAttempt,
  MessageTracking,
  LinkClick,
  SessionTracking,
  Student,
  Lesson
} = require('../models');
const { authenticate } = require('../middleware/auth');

// ============================================================
// LESSON VIEW TRACKING
// ============================================================

// Track a lesson view
router.post('/lesson-view', authenticate, async (req, res) => {
  try {
    const { lessonId, watchTime, isCompleted, completionPercentage } = req.body;
    const studentId = req.user.id;

    // Validate
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId is required'
      });
    }

    // Find or create lesson view record
    let lessonView = await LessonView.findOne({
      where: { studentId, lessonId }
    });

    if (lessonView) {
      // Update existing record
      lessonView.viewCount += 1;
      lessonView.totalWatchTime = (lessonView.totalWatchTime || 0) + (watchTime || 0);
      lessonView.lastWatchTime = watchTime || 0;
      lessonView.lastViewedAt = new Date();
      
      if (isCompleted !== undefined) {
        lessonView.isCompleted = isCompleted;
      }
      if (completionPercentage !== undefined) {
        lessonView.completionPercentage = Math.min(completionPercentage, 100);
      }
      
      await lessonView.save();
    } else {
      // Create new record
      lessonView = await LessonView.create({
        studentId,
        lessonId,
        viewCount: 1,
        totalWatchTime: watchTime || 0,
        lastWatchTime: watchTime || 0,
        isCompleted: isCompleted || false,
        completionPercentage: completionPercentage || 0,
        firstViewedAt: new Date(),
        lastViewedAt: new Date()
      });
    }

    // Update lesson total views
    await Lesson.increment('views', { where: { id: lessonId } });

    // Update student total time spent
    if (watchTime) {
      await Student.increment('totalTimeSpent', {
        by: watchTime,
        where: { id: studentId }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Lesson view tracked',
      data: lessonView
    });

  } catch (error) {
    console.error('Lesson view tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking lesson view'
    });
  }
});

// ============================================================
// VIDEO TRACKING
// ============================================================

router.post('/video', authenticate, async (req, res) => {
  try {
    const { lessonId, watchTime, totalDuration, isCompleted, watchPercentage } = req.body;
    const studentId = req.user.id;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId is required'
      });
    }

    const videoTracking = await VideoTracking.create({
      studentId,
      lessonId,
      watchTime: watchTime || 0,
      totalDuration: totalDuration || 0,
      isCompleted: isCompleted || false,
      watchPercentage: Math.min(watchPercentage || 0, 100),
      timestamp: new Date()
    });

    // Also update lesson view
    await LessonView.update(
      { totalWatchTime: watchTime || 0 },
      { where: { studentId, lessonId } }
    );

    return res.status(201).json({
      success: true,
      message: 'Video tracking saved',
      data: videoTracking
    });

  } catch (error) {
    console.error('Video tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking video'
    });
  }
});

// ============================================================
// FILE TRACKING
// ============================================================

router.post('/file', authenticate, async (req, res) => {
  try {
    const { lessonId, fileName, fileType, action } = req.body;
    const studentId = req.user.id;

    if (!fileName || !action) {
      return res.status(400).json({
        success: false,
        message: 'fileName and action are required'
      });
    }

    const fileTracking = await FileTracking.create({
      studentId,
      lessonId: lessonId || null,
      fileName,
      fileType: fileType || 'unknown',
      action, // 'view', 'download', 'preview'
      timestamp: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'File action tracked',
      data: fileTracking
    });

  } catch (error) {
    console.error('File tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking file'
    });
  }
});

// ============================================================
// QUIZ ATTEMPT TRACKING
// ============================================================

router.post('/quiz', authenticate, async (req, res) => {
  try {
    const { quizId, answers, score, totalQuestions, timeSpent, isPassed } = req.body;
    const studentId = req.user.id;

    if (!quizId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'quizId and answers are required'
      });
    }

    const quizAttempt = await QuizAttempt.create({
      studentId,
      quizId,
      answers,
      score: score || 0,
      totalQuestions: totalQuestions || 0,
      timeSpent: timeSpent || 0,
      isPassed: isPassed || false,
      attemptDate: new Date()
    });

    // Update student engagement score
    if (score > 0) {
      await Student.increment('engagementScore', {
        by: 1,
        where: { id: studentId }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Quiz attempt saved',
      data: quizAttempt
    });

  } catch (error) {
    console.error('Quiz tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking quiz'
    });
  }
});

// ============================================================
// MESSAGE TRACKING
// ============================================================

router.post('/message', authenticate, async (req, res) => {
  try {
    const { teacherId, message } = req.body;
    const studentId = req.user.id;

    if (!teacherId || !message) {
      return res.status(400).json({
        success: false,
        message: 'teacherId and message are required'
      });
    }

    const messageTracking = await MessageTracking.create({
      studentId,
      teacherId,
      message,
      isRead: false,
      timestamp: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Message tracked',
      data: messageTracking
    });

  } catch (error) {
    console.error('Message tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking message'
    });
  }
});

// ============================================================
// LINK CLICK TRACKING
// ============================================================

router.post('/link-click', authenticate, async (req, res) => {
  try {
    const { lessonId, url, linkText, linkType } = req.body;
    const studentId = req.user.id;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'url is required'
      });
    }

    const linkClick = await LinkClick.create({
      studentId,
      lessonId: lessonId || null,
      url,
      linkText: linkText || null,
      linkType: linkType || 'external',
      timestamp: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Link click tracked',
      data: linkClick
    });

  } catch (error) {
    console.error('Link click tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking link click'
    });
  }
});

// ============================================================
// SESSION TRACKING
// ============================================================

router.post('/session', authenticate, async (req, res) => {
  try {
    const { sessionStart, sessionEnd, pagesViewed, deviceType, browser, ipAddress } = req.body;
    const studentId = req.user.id;

    if (!sessionStart) {
      return res.status(400).json({
        success: false,
        message: 'sessionStart is required'
      });
    }

    const sessionDuration = sessionEnd 
      ? Math.floor((new Date(sessionEnd) - new Date(sessionStart)) / 1000)
      : 0;

    const sessionTracking = await SessionTracking.create({
      studentId,
      sessionStart: new Date(sessionStart),
      sessionEnd: sessionEnd ? new Date(sessionEnd) : null,
      sessionDuration,
      pagesViewed: pagesViewed || 0,
      deviceType: deviceType || 'unknown',
      browser: browser || 'unknown',
      ipAddress: ipAddress || null
    });

    return res.status(201).json({
      success: true,
      message: 'Session tracked',
      data: sessionTracking
    });

  } catch (error) {
    console.error('Session tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking session'
    });
  }
});

// ============================================================
// GET ANALYTICS DATA
// ============================================================

// Get student activity summary
router.get('/student/:studentId/summary', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student info
    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'name', 'email', 'engagementScore', 'totalTimeSpent']
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all tracking data
    const [lessons, videos, files, quizzes, messages, links, sessions] = await Promise.all([
      LessonView.findAll({ where: { studentId } }),
      VideoTracking.findAll({ where: { studentId } }),
      FileTracking.findAll({ where: { studentId } }),
      QuizAttempt.findAll({ where: { studentId } }),
      MessageTracking.findAll({ where: { studentId } }),
      LinkClick.findAll({ where: { studentId } }),
      SessionTracking.findAll({ where: { studentId } })
    ]);

    // Calculate summary
    const totalLessonsViewed = lessons.length;
    const completedLessons = lessons.filter(l => l.isCompleted).length;
    const totalVideosWatched = videos.length;
    const totalFilesOpened = files.length;
    const totalQuizzesTaken = quizzes.length;
    const avgQuizScore = quizzes.length > 0
      ? (quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
      : 0;
    const totalMessages = messages.length;
    const totalLinksClicked = links.length;
    const totalSessions = sessions.length;
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.sessionDuration, 0);

    return res.status(200).json({
      success: true,
      data: {
        student,
        summary: {
          totalLessonsViewed,
          completedLessons,
          completionRate: totalLessonsViewed > 0 
            ? (completedLessons / totalLessonsViewed) * 100 
            : 0,
          totalVideosWatched,
          totalFilesOpened,
          totalQuizzesTaken,
          avgQuizScore,
          totalMessages,
          totalLinksClicked,
          totalSessions,
          totalTimeSpent
        },
        recentActivity: {
          lessons: lessons.slice(-5),
          quizzes: quizzes.slice(-5),
          messages: messages.slice(-5)
        }
      }
    });

  } catch (error) {
    console.error('Student summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching student summary'
    });
  }
});

// Get platform-wide analytics (admin only)
router.get('/admin/platform', authenticate, async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalLessons,
      totalBookings,
      totalLessonViews,
      totalQuizzes,
      totalSessions
    ] = await Promise.all([
      Student.count(),
      Teacher.count(),
      Lesson.count(),
      Booking.count(),
      LessonView.count(),
      QuizAttempt.count(),
      SessionTracking.count()
    ]);

    // Get daily active students (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeStudents = await SessionTracking.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('sessionStart')), 'date'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT "studentId"')), 'count']
      ],
      where: {
        sessionStart: {
          [sequelize.Op.gte]: sevenDaysAgo
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('sessionStart'))],
      order: [[sequelize.fn('DATE', sequelize.col('sessionStart')), 'ASC']]
    });

    // Get most viewed lessons
    const popularLessons = await Lesson.findAll({
      attributes: ['id', 'title', 'views'],
      order: [['views', 'DESC']],
      limit: 5
    });

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          students: totalStudents,
          teachers: totalTeachers,
          lessons: totalLessons,
          bookings: totalBookings,
          lessonViews: totalLessonViews,
          quizzes: totalQuizzes,
          sessions: totalSessions
        },
        activeStudents: {
          daily: activeStudents,
          totalActive: activeStudents.length
        },
        popularLessons
      }
    });

  } catch (error) {
    console.error('Platform analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching platform analytics'
    });
  }
});

module.exports = router;
