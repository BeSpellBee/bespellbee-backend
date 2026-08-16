
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
    },
    // ✅ Link to Teacher
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'teacher_id'
    }
  }, {
    tableName: 'students',
    timestamps: false
  });

  // ✅ Association defined here
  Student.associate = function(models) {
    Student.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
    Student.hasMany(models.StudentActivity, { foreignKey: 'student_id' });
  };

  return Student;
};
