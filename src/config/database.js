const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use DATABASE_URL from environment
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false // Set to console.log to see SQL queries
});

module.exports = { sequelize };
