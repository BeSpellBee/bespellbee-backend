const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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

// ===== LESSON =====
const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
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
  order: {
    type: DataTypes.INTEGER
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avgTimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'avg_time_spent'
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
    field: 'lesson_id'
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
    field: 'student_id'
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quiz_id'
  },
  answers: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timeTaken: {
    type: DataTypes.INTEGER,
    field: 'time_taken'
  },
  attemptDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'attempt_date'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_completed'
  }
}, {
  tableName: 'quiz_attempts',
  timestamps: false
});

// ===== ACTIVITY =====
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
    field: 'lesson_id'
  },
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'action_type'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'student_activities',
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
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'bookings',
  timestamps: false
});

// ===== RELATIONSHIPS =====
Student.hasMany(Activity, { foreignKey: 'studentId' });
Activity.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(QuizAttempt, { foreignKey: 'studentId' });
QuizAttempt.belongsTo(Student, { foreignKey: 'studentId' });

Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId' });

Lesson.hasMany(Quiz, { foreignKey: 'lessonId' });
Quiz.belongsTo(Lesson, { foreignKey: 'lessonId' });

Lesson.hasMany(Activity, { foreignKey: 'lessonId' });
Activity.belongsTo(Lesson, { foreignKey: 'lessonId' });

// ===== EXPORTS =====
module.exports = {
  Teacher,
  Student,
  Lesson,
  Quiz,
  QuizAttempt,
  Activity,
  Booking  // ← Added Booking here!
};
