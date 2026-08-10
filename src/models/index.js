const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ===== STUDENT =====
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
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  totalTimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_time_spent'
  },
  engagementScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'engagement_score'
  }
}, {
  tableName: 'students',
  timestamps: false
});

// ===== TEACHER =====
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
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
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

// ===== LESSON =====
const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'teacher_id',
    references: {
      model: 'teachers',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  videoUrl: {
    type: DataTypes.STRING(500),
    field: 'video_url'
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    field: 'file_url'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  order: {
    type: DataTypes.INTEGER
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avgWatchTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'avg_watch_time'
  },
  completionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'completion_rate'
  }
}, {
  tableName: 'lessons',
  timestamps: false
});

// ===== QUIZ =====
const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  correctAnswer: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'correct_answer'
  },
  difficulty: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'quizzes',
  timestamps: false
});

// ===== BOOKING =====
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
    type: DataTypes.STRING(50),
    field: 'student_phone'
  },
  teacherName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'teacher_name'
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
    defaultValue: 'pending',
    field: 'status'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'bookings',
  timestamps: false
});

// ===== LESSON VIEW TRACKING =====
const LessonView = sequelize.define('LessonView', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'view_count'
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
    type: DataTypes.INTEGER,
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

// ===== VIDEO TRACKING =====
const VideoTracking = sequelize.define('VideoTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
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
    type: DataTypes.INTEGER,
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

// ===== FILE TRACKING =====
const FileTracking = sequelize.define('FileTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  fileName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'file_name'
  },
  fileType: {
    type: DataTypes.STRING(50),
    field: 'file_type'
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'action' // 'view', 'download', 'preview'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'file_tracking',
  timestamps: false
});

// ===== QUIZ ATTEMPT =====
const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quiz_id',
    references: {
      model: 'quizzes',
      key: 'id'
    }
  },
  answers: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_questions'
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'time_spent'
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

// ===== MESSAGE TRACKING =====
const MessageTracking = sequelize.define('MessageTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'teacher_id',
    references: {
      model: 'teachers',
      key: 'id'
    }
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
  readAt: {
    type: DataTypes.DATE,
    field: 'read_at'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'message_tracking',
  timestamps: false
});

// ===== LINK CLICK TRACKING =====
const LinkClick = sequelize.define('LinkClick', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
  },
  lessonId: {
    type: DataTypes.INTEGER,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  linkText: {
    type: DataTypes.STRING(200),
    field: 'link_text'
  },
  linkType: {
    type: DataTypes.STRING(20),
    field: 'link_type' // 'internal', 'external', 'resource'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'link_clicks',
  timestamps: false
});

// ===== SESSION TRACKING =====
const SessionTracking = sequelize.define('SessionTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
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
    field: 'device_type'
  },
  browser: {
    type: DataTypes.STRING(50)
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    field: 'ip_address'
  }
}, {
  tableName: 'session_tracking',
  timestamps: false
});

// ===== RELATIONSHIPS =====
Student.hasMany(LessonView, { foreignKey: 'studentId' });
LessonView.belongsTo(Student, { foreignKey: 'studentId' });

Lesson.hasMany(LessonView, { foreignKey: 'lessonId' });
LessonView.belongsTo(Lesson, { foreignKey: 'lessonId' });

Student.hasMany(VideoTracking, { foreignKey: 'studentId' });
VideoTracking.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(FileTracking, { foreignKey: 'studentId' });
FileTracking.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(QuizAttempt, { foreignKey: 'studentId' });
QuizAttempt.belongsTo(Student, { foreignKey: 'studentId' });

Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId' });

Student.hasMany(MessageTracking, { foreignKey: 'studentId' });
MessageTracking.belongsTo(Student, { foreignKey: 'studentId' });

Teacher.hasMany(MessageTracking, { foreignKey: 'teacherId' });
MessageTracking.belongsTo(Teacher, { foreignKey: 'teacherId' });

Student.hasMany(LinkClick, { foreignKey: 'studentId' });
LinkClick.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(SessionTracking, { foreignKey: 'studentId' });
SessionTracking.belongsTo(Student, { foreignKey: 'studentId' });

Lesson.hasMany(LinkClick, { foreignKey: 'lessonId' });
LinkClick.belongsTo(Lesson, { foreignKey: 'lessonId' });

Teacher.hasMany(Lesson, { foreignKey: 'teacherId' });
Lesson.belongsTo(Teacher, { foreignKey: 'teacherId' });

Lesson.hasMany(Quiz, { foreignKey: 'lessonId' });
Quiz.belongsTo(Lesson, { foreignKey: 'lessonId' });

// ===== EXPORTS =====
module.exports = {
  Student,
  Teacher,
  Lesson,
  Quiz,
  Booking,
  LessonView,
  VideoTracking,
  FileTracking,
  QuizAttempt,
  MessageTracking,
  LinkClick,
  SessionTracking
};
