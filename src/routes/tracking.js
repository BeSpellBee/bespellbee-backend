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
  StudentActivity,
  StudentSession,
  Message,
  VideoProgress
} = require('../models');
const { authenticate } = require('../middleware/auth');
const { sequelize } = require('../config/database');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

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

    // Log activity
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

    // Log activity
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
// VIDEO PROGRESS (Enhanced)
// ============================================================

router.post('/video-progress', authenticate, async (req, res) => {
  try {
    const { 
      videoId, 
      videoTitle, 
      action, 
      currentTime, 
      duration, 
      progress 
    } = req.body;
    const studentId = req.user.id;

    // Log video activity
    await StudentActivity.create({
      studentId,
      activityType: 'video_interaction',
      activityData: {
        videoId,
        videoTitle: videoTitle || 'Untitled',
        action,
        currentTime,
        duration,
        progress,
        timestamp: new Date().toISOString()
      },
      pageUrl: req.headers.referer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.headers['x-session-id'] || req.sessionID
    });

    // Update or create video progress
    if (['pause', 'ended', 'seeked'].includes(action) || progress !== undefined) {
      const [videoProgress, created] = await VideoProgress.findOrCreate({
        where: { studentId, videoId },
        defaults: {
          videoTitle: videoTitle || 'Untitled',
          watchedDuration: currentTime || 0,
          totalDuration: duration || 0,
          completionPercentage: progress || 0,
          lastPosition: currentTime || 0,
          completed: progress >= 100,
          startedAt: new Date(),
          updatedAt: new Date()
        }
      });

      if (!created) {
        const newWatchedDuration = Math.max(videoProgress.watchedDuration || 0, currentTime || 0);
        const newCompletion = Math.min(progress || 0, 100);
        
        await videoProgress.update({
          watchedDuration: newWatchedDuration,
          totalDuration: duration || videoProgress.totalDuration,
          completionPercentage: newCompletion,
          lastPosition: currentTime || 0,
          completed: newCompletion >= 100,
          completedAt: newCompletion >= 100 ? new Date() : null,
          updatedAt: new Date()
        });
      }

      if (progress >= 100) {
        await StudentActivity.create({
          studentId,
          activityType: 'video_completed',
          activityData: {
            videoId,
            videoTitle: videoTitle || 'Untitled',
            duration: duration || 0,
            timestamp: new Date().toISOString()
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          sessionId: req.headers['x-session-id'] || req.sessionID
        });

        await Student.increment('engagementScore', {
          by: 2,
          where: { id: studentId }
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Video progress tracked'
    });

  } catch (error) {
    console.error('Video progress tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking video progress'
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
// QUIZ ATTEMPT TRACKING (Enhanced)
// ============================================================

router.post('/quiz-attempt', authenticate, async (req, res) => {
  try {
    const { 
      quizId, 
      quizTitle, 
      answers, 
      score, 
      totalQuestions, 
      timeTaken,
      isPassed 
    } = req.body;
    const studentId = req.user.id;

    if (!quizId || !answers) {
      return res.status(400).json({
        success: false,
        message: 'quizId and answers are required'
      });
    }

    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const wrongAnswers = totalQuestions - correctAnswers;

    const quizAttempt = await QuizAttempt.create({
      studentId,
      quizId,
      quizTitle: quizTitle || 'Untitled Quiz',
      answers,
      score: score || 0,
      totalQuestions: totalQuestions || 0,
      correctAnswers,
      wrongAnswers,
      timeTaken: timeTaken || 0,
      isPassed: isPassed || false,
      attemptDate: new Date()
    });

    await StudentActivity.create({
      studentId,
      activityType: 'quiz_attempt',
      activityData: {
        quizId,
        quizTitle: quizTitle || 'Untitled Quiz',
        score: score || 0,
        totalQuestions: totalQuestions || 0,
        correctAnswers,
        wrongAnswers,
        timeTaken: timeTaken || 0,
        isPassed: isPassed || false,
        timestamp: new Date().toISOString()
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.headers['x-session-id'] || req.sessionID,
      duration: timeTaken || 0
    });

    await Student.increment('engagementScore', {
      by: 3,
      where: { id: studentId }
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz attempt tracked',
      data: {
        attemptId: quizAttempt.id,
        correct: correctAnswers,
        total: totalQuestions,
        score: score || 0,
        passed: isPassed || false
      }
    });

  } catch (error) {
    console.error('Quiz attempt tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking quiz attempt'
    });
  }
});

// ============================================================
// QUIZ TRACKING (Legacy - keep for compatibility)
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
// SEND MESSAGE (Enhanced)
// ============================================================

router.post('/send-message', authenticate, async (req, res) => {
  try {
    const { teacherId, content } = req.body;
    const studentId = req.user.id;

    if (!teacherId || !content) {
      return res.status(400).json({
        success: false,
        message: 'teacherId and content are required'
      });
    }

    const message = await Message.create({
      studentId,
      teacherId,
      content,
      isRead: false,
      createdAt: new Date()
    });

    await StudentActivity.create({
      studentId,
      activityType: 'message_sent',
      activityData: {
        teacherId,
        contentLength: content.length,
        preview: content.substring(0, 50),
        timestamp: new Date().toISOString()
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.headers['x-session-id'] || req.sessionID
    });

    await Student.increment('engagementScore', {
      by: 0.5,
      where: { id: studentId }
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending message'
    });
  }
});

// ============================================================
// GET MESSAGES
// ============================================================

router.get('/messages', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;

    const messages = await Message.findAll({
      where: { studentId },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    return res.status(200).json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    });
  }
});

// ============================================================
// MARK MESSAGE AS READ
// ============================================================

router.put('/message/:id/read', authenticate, async (req, res) => {
  try {
    const messageId = req.params.id;
    const studentId = req.user.id;

    const message = await Message.findOne({
      where: { id: messageId, studentId }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.update({
      isRead: true,
      readAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking message as read'
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
// PAGE VIEW TRACKING
// ============================================================

router.post('/page-view', authenticate, async (req, res) => {
  try {
    const { page, url, duration, from, to } = req.body;
    const studentId = req.user.id;

    const activity = await StudentActivity.create({
      studentId,
      activityType: 'page_view',
      activityData: {
        page: page || 'unknown',
        url: url || req.headers.referer || 'unknown',
        from: from || null,
        to: to || null,
        timestamp: new Date().toISOString()
      },
      pageUrl: url || req.headers.referer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.headers['x-session-id'] || req.sessionID,
      duration: duration || 0
    });

    await Student.increment('engagementScore', {
      by: 0.1,
      where: { id: studentId }
    });

    return res.status(201).json({
      success: true,
      message: 'Page view tracked',
      data: activity
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
// GET STUDENT DASHBOARD
// ============================================================

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'name', 'email', 'engagementScore', 'totalTimeSpent', 'createdAt']
    });

    const [
      activities,
      videoProgress,
      quizAttempts,
      messages,
      sessions
    ] = await Promise.all([
      StudentActivity.findAll({
        where: { studentId },
        order: [['createdAt', 'DESC']],
        limit: 50
      }),
      VideoProgress.findAll({
        where: { studentId },
        order: [['updatedAt', 'DESC']]
      }),
      QuizAttempt.findAll({
        where: { studentId },
        order: [['attemptDate', 'DESC']],
        limit: 20
      }),
      Message.findAll({
        where: { studentId },
        order: [['createdAt', 'DESC']],
        limit: 20
      }),
      StudentSession.findAll({
        where: { studentId },
        order: [['loginTime', 'DESC']],
        limit: 10
      })
    ]);

    const totalVideos = videoProgress.length;
    const completedVideos = videoProgress.filter(v => v.completed).length;
    const totalQuizzes = quizAttempts.length;
    const avgScore = totalQuizzes > 0 
      ? quizAttempts.reduce((sum, q) => sum + parseFloat(q.score || 0), 0) / totalQuizzes 
      : 0;
    const totalMessages = messages.length;
    const unreadMessages = messages.filter(m => !m.isRead).length;
    const totalSessions = sessions.length;
    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0);

    const activityTypes = await StudentActivity.findAll({
      where: { studentId },
      attributes: [
        'activityType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['activityType']
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await StudentActivity.findAll({
      where: {
        studentId,
        createdAt: {
          [sequelize.Op.gte]: sevenDaysAgo
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        student: {
          ...student.toJSON(),
          totalTimeSpent: totalTimeSpent || student.totalTimeSpent
        },
        stats: {
          totalVideos,
          completedVideos,
          completionRate: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0,
          totalQuizzes,
          avgScore: Math.round(avgScore * 100) / 100,
          totalMessages,
          unreadMessages,
          totalSessions,
          totalTimeSpent
        },
        recentActivity: {
          activities: activities.slice(0, 10),
          videos: videoProgress.slice(0, 5),
          quizzes: quizAttempts.slice(0, 5),
          messages: messages.slice(0, 5)
        },
        activityTypes: activityTypes.map(a => ({
          type: a.activityType,
          count: parseInt(a.dataValues.count)
        })),
        dailyActivity: dailyActivity.map(d => ({
          date: d.dataValues.date,
          count: parseInt(d.dataValues.count)
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

// ============================================================
// STUDENT SUMMARY (Legacy - keep for compatibility)
// ============================================================

router.get('/student/:studentId/summary', authenticate, async (req, res) => {
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

    const [lessons, videos, files, quizzes, messages, links, sessions] = await Promise.all([
      LessonView.findAll({ where: { studentId } }),
      VideoTracking.findAll({ where: { studentId } }),
      FileTracking.findAll({ where: { studentId } }),
      QuizAttempt.findAll({ where: { studentId } }),
      MessageTracking.findAll({ where: { studentId } }),
      LinkClick.findAll({ where: { studentId } }),
      SessionTracking.findAll({ where: { studentId } })
    ]);

    const totalLessonsViewed = lessons.length;
    const completedLessons = lessons.filter(l => l.isCompleted).length;
    const totalVideosWatched = videos.length;
    const totalFilesOpened = files.length;
    const totalQuizzesTaken = quizzes.length;
    const avgQuizScore = quizzes.length > 0
      ? (quizzes.reduce((sum, q) => sum + parseFloat(q.score || 0), 0) / quizzes.length)
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

// ============================================================
// PLATFORM ANALYTICS (Admin)
// ============================================================

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
