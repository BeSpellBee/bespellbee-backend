const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
// Restrict CORS to your deployed GitHub frontend domain
app.use(cors({
  origin: [
    'https://bespellbee.github.io/BeSpellBee', // Your GitHub Pages frontend
    'http://localhost:3000'                      // Keep for local frontend testing
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BeSpellBee API is running',
    timestamp: new Date().toISOString()
  });
});

// Root test route
app.get('/', (req, res) => {
  res.send('BeSpellBee API is running');
});

// ===== AUTHENTICATION ROUTES =====
// POST /api/auth/register-teacher
// POST /api/auth/login
app.use('/api/auth', authRoutes);

// ===== ANALYTICS ROUTES =====
// POST /api/analytics/track/lesson-view
// POST /api/analytics/track/file-open
// POST /api/analytics/track/quiz-submit
// POST /api/analytics/track/activity
// GET  /api/analytics/teacher/students
// GET  /api/analytics/teacher/student/:studentId
// GET  /api/analytics/admin/analytics
app.use('/api/analytics', analyticsRoutes);

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
