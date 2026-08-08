// Main Express Application
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BeSpellBee API is running',
    timestamp: new Date().toISOString()
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
