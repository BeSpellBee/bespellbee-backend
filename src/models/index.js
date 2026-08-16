const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ============================================================
// TEACHER MODEL
// ============================================================

const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'password_hash'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  avgStudentProgress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'avg_student_progress'
  }
}, {
  tableName: 'teachers',
  timestamps: false
});

// ============================================================
// STUDENT MODEL
// ============================================================

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'password_hash'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  engagementScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'engagement_score'
  },
  totalTimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_time_spent'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'students',
  timestamps: false
});

// ============================================================
// LESSON MODEL
// ============================================================

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'lessons',
  timestamps: false
});

// ============================================================
// QUIZ MODEL
// ============================================================

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'lesson_id'
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  correctAnswer: {
    type: DataTypes.STRING(50),
    field: 'correct_answer'
  }
}, {
  tableName: 'quizzes',
  timestamps: false
});

// ============================================================
// ACTIVITY MODEL
// ============================================================

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'lesson_id'
  },
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'action_type'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'activities',
  timestamps: false
});

// ============================================================
// BOOKING MODEL
// ============================================================

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'student_name'
  },
  studentEmail: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'student_email'
  },
  studentPhone: {
    type: DataTypes.STRING(20),
    field: 'student_phone'
  },
  teacherName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'teacher_name'
  },
  teacherSubject: {
    type: DataTypes.STRING(100),
    field: 'teacher_subject'
  },
  timeSlot: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'time_slot'
  },
  message: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'bookings',
  timestamps: false
});

// ============================================================
// TRACKING MODELS
// ============================================================

const LessonView = sequelize.define('LessonView', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lesson_id'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalWatchTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_watch_time'
  },
  lastWatchTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'last_watch_time'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  },
  completionPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'completion_percentage'
  },
  firstViewedAt: {
    type: DataTypes.DATE,
    field: 'first_viewed_at'
  },
  lastViewedAt: {
    type: DataTypes.DATE,
    field: 'last_viewed_at'
  }
}, {
  tableName: 'lesson_views',
  timestamps: false
});

const VideoTracking = sequelize.define('VideoTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'lesson_id'
  },
  watchTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'watch_time'
  },
  totalDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_duration'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  },
  watchPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'watch_percentage'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'video_tracking',
  timestamps: false
});

const FileTracking = sequelize.define('FileTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'lesson_id'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
  },
  fileType: {
    type: DataTypes.STRING(50),
    defaultValue: 'unknown',
    field: 'file_type'
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'file_tracking',
  timestamps: false
});

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  quizId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'quiz_id'
  },
  quizTitle: {
    type: DataTypes.STRING(255),
    field: 'quiz_title'
  },
  answers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_questions'
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'correct_answers'
  },
  wrongAnswers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'wrong_answers'
  },
  timeTaken: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'time_taken'
  },
  isPassed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_passed'
  },
  attemptDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'attempt_date'
  }
}, {
  tableName: 'quiz_attempts',
  timestamps: false
});

const MessageTracking = sequelize.define('MessageTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'teacher_id'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'message_tracking',
  timestamps: false
});

const LinkClick = sequelize.define('LinkClick', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'lesson_id'
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  linkText: {
    type: DataTypes.STRING(255),
    field: 'link_text'
  },
  linkType: {
    type: DataTypes.STRING(50),
    defaultValue: 'external',
    field: 'link_type'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'link_clicks',
  timestamps: false
});

const SessionTracking = sequelize.define('SessionTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  sessionStart: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'session_start'
  },
  sessionEnd: {
    type: DataTypes.DATE,
    field: 'session_end'
  },
  sessionDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'session_duration'
  },
  pagesViewed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'pages_viewed'
  },
  deviceType: {
    type: DataTypes.STRING(50),
    defaultValue: 'unknown',
    field: 'device_type'
  },
  browser: {
    type: DataTypes.STRING(50),
    defaultValue: 'unknown'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    field: 'ip_address'
  }
}, {
  tableName: 'session_tracking',
  timestamps: false
});

// ============================================================
// STUDENT ACTIVITY MODEL - FIXED WITH field MAPPINGS
// ============================================================

const StudentActivity = sequelize.define('StudentActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id'
  },
  activityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'activity_type'
  },
  activityData: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'activity_data'        // ✅ FIXED
  },
  pageUrl: {
    type: DataTypes.TEXT,
    field: 'page_url'             // ✅ FIXED
  },
    page: {
    type: DataTypes.STRING(100),
    field: 'page'               // NEW - store page name directly
  },
  teacherName: {
    type: DataTypes.STRING(100),
    field: 'teacher_name'       // NEW - store teacher name directly
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    field: 'ip_address'           // ✅ FIXED
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'           // ✅ FIXED
  },
  sessionId: {
    type: DataTypes.STRING(255),
    field: 'session_id'           // ✅ FIXED
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'student_activities',
  timestamps: false
});

// ============================================================
// EXPORT ALL MODELS
// ============================================================

module.exports = {
  Teacher,
  Student,
  Lesson,
  Quiz,
  Activity,
  Booking,
  LessonView,
  VideoTracking,
  FileTracking,
  QuizAttempt,
  MessageTracking,
  LinkClick,
  SessionTracking,
  StudentActivity
};
// ---------- Student Model ----------
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'password_hash'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  engagementScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'engagement_score'
  },
  totalTimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_time_spent'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  // ✅ NEW: link to Teacher
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'teacher_id'
  }
}, {
  tableName: 'students',
  timestamps: false
});
