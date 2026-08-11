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
        const newCompletion = Math.min(progress || 0, 
