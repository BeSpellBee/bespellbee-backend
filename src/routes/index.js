const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define Teacher model
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

module.exports = { Teacher };
