const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully.');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
