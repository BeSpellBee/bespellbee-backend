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
  Lesson,
  Teacher,
  Booking,
  StudentActivity  // ← ADD THIS
} = require('../models');
const { authenticate } = require('../middleware/auth');

// ============================================================
// LESSON VIEW TRACKING
// ============================================================

router.post('/lesson-view', authenticate, async (req, res) => {
  try {
    const { lessonId, watchTime, isCompleted, completionPercentage } = req.body;
    const studentId = req.user.id;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId is required'
      });
    }

    let lessonView = await LessonView.findOne({
      where: { studentId, lessonId }
    });

    if (lessonView) {
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

    await Lesson.increment('views', { where: { id: lessonId } });

    if (watchTime) {
      await Student.increment('totalTimeSpent', {
        by: watchTime,
        where: { id: studentId }
      });
    }

    // ✅ SAVE TO student_activities
    await StudentActivity.create({
      studentId,
      activityType: 'lesson_view',
      activityData: {
        lessonId,
        watchTime: watchTime || 0,
        isCompleted: isCompleted || false,
        completionPercentage: completionPercentage || 0
      },
      sessionId: req.headers['x-session-id'] || req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      duration: watchTime || 0
    });

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

    await LessonView.update(
      { totalWatchTime: watchTime || 0 },
      { where: { studentId, lessonId } }
    );

    // ✅ SAVE TO student_activities
    await StudentActivity.create({
      studentId,
      activityType: 'video_watch',
      activityData: {
        lessonId,
        watchTime: watchTime || 0,
        totalDuration: totalDuration || 0,
        watchPercentage: watchPercentage || 0,
        isCompleted: isCompleted || false
      },
      sessionId: req.headers['x-session-id'] || req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      duration: watchTime || 0
    });

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
      action,
      timestamp: new Date()
    });

    // ✅ SAVE TO student_activities
    await StudentActivity.create({
      studentId,
      activityType: 'file_' + action,
      activityData: {
        fileName,
        fileType: fileType || 'unknown',
        lessonId: lessonId || null
      },
      sessionId: req.headers['x-session-id'] || req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
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
      quizTitle: req.body.quizTitle || 'Untitled Quiz',
      answers,
      score: score || 0,
      totalQuestions: totalQuestions || 0,
      correctAnswers: answers.filter(a => a.isCorrect).length,
      wrongAnswers: totalQuestions - answers.filter(a => a.isCorrect).length,
      timeTaken: timeSpent || 0,
      isPassed: isPassed || false,
      attemptDate: new Date()
    });

    // ✅ SAVE TO student_activities
    await StudentActivity.create({
      studentId,
      activityType: 'quiz_attempt',
      activityData: {
        quizId,
        quizTitle: req.body.quizTitle || 'Untitled Quiz',
        score: score || 0,
        totalQuestions: totalQuestions || 0,
        correctAnswers: answers.filter(a => a.isCorrect).length,
        wrongAnswers: totalQuestions - answers.filter(a => a.isCorrect).length,
        timeTaken: timeSpent || 0,
        isPassed: isPassed || false
      },
      sessionId: req.headers['x-session-id'] || req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      duration: timeSpent || 0
    });

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

    // ✅ SAVE TO student_activities
    await StudentActivity.create({
      studentId,
      activityType: 'message_sent',
      activityData: {
        teacherId,
        messageLength: message.length,
        preview: message.substring(0, 50)
      },
      sessionId: req.headers['x-session-id'] || req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
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

    // ✅ SAVE TO student_activities
    await StudentActivity.create({
      studentId,
      activityType: 'link_click',
      activityData: {
        url,
        linkText: linkText || null,
        linkType: linkType || 'external',
        lessonId: lessonId || null
      },
      sessionId: req.headers['x-session-id'] || req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
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

    // ✅ SAVE TO student_activities
    await StudentActivity.create({
      studentId,
      activityType: 'session',
      activityData: {
        sessionStart,
        sessionEnd,
        sessionDuration,
        pagesViewed: pagesViewed || 0,
        deviceType: deviceType || 'unknown',
        browser: browser || 'unknown'
      },
      sessionId: req.headers['x-session-id'] || req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      duration: sessionDuration
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
// PAGE VIEW TRACKING (FIXED - NOW SAVES TO DATABASE)
// ============================================================

router.post('/page-view', authenticate, async (req, res) => {
  try {
    const { page, url, duration, action, teacher, subject } = req.body;
    const studentId = req.user.id;

    // ✅ SAVE TO DATABASE
    await StudentActivity.create({
      studentId,
      activityType: 'page_view',
      activityData: {
        page: page || 'unknown',
        url: url || req.headers.referer || 'unknown',
        action: action || 'view',
        teacher: teacher || null,
        subject: subject || null,
        duration: duration || 0,
        timestamp: new Date().toISOString()
      },
      pageUrl: url || req.headers.referer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.headers['x-session-id'] || req.sessionID,
      duration: duration || 0
    });

    // Log to console
    console.log(`📊 Page View: Student ${studentId} viewed ${page || 'unknown'}`);

    // Update engagement score
    await Student.increment('engagementScore', {
      by: 0.1,
      where: { id: studentId }
    });

    return res.status(201).json({
      success: true,
      message: 'Page view tracked'
    });

  } catch (error) {
    console.error('Page view tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking page view'
    });
  }
});

// ============================================================
// DASHBOARD
// ============================================================

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'name', 'email', 'engagementScore', 'totalTimeSpent']
    });

    const quizAttempts = await QuizAttempt.findAll({
      where: { studentId },
      order: [['attemptDate', 'DESC']],
      limit: 20
    });

    const messages = await MessageTracking.findAll({
      where: { studentId },
      order: [['timestamp', 'DESC']],
      limit: 20
    });

    // Get page views from student_activities
    const pageViews = await StudentActivity.findAll({
      where: { 
        studentId,
        activityType: 'page_view'
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const totalQuizzes = quizAttempts.length;
    const avgScore = totalQuizzes > 0 
      ? quizAttempts.reduce((sum, q) => sum + parseFloat(q.score || 0), 0) / totalQuizzes 
      : 0;
    const totalMessages = messages.length;

    return res.status(200).json({
      success: true,
      data: {
        student: {
          ...student.toJSON(),
          totalTimeSpent: student.totalTimeSpent || 0
        },
        stats: {
          completedVideos: 0,
          totalQuizzes,
          avgScore: Math.round(avgScore * 100) / 100,
          totalMessages,
          unreadMessages: messages.filter(m => !m.isRead).length,
          totalSessions: 0,
          totalTimeSpent: student.totalTimeSpent || 0,
          totalPageViews: pageViews.length
        },
        recentActivity: {
          quizzes: quizAttempts.slice(0, 5),
          messages: messages.slice(0, 5),
          pageViews: pageViews.slice(0, 5)
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard'
    });
  }
});

module.exports = router;
