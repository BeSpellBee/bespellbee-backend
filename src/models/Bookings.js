const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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

module.exports = Booking;
