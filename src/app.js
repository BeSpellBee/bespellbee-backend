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
// ===== MIDDLEWARE =====
// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    'https://bespellbee.github.io',                  // Base domain
    'https://bespellbee.github.io/BeSpellBee',       // Specific path
    'https://bespellbee.github.io/BeSpellBee/',      // With trailing slash
    'http://localhost:3000',                          // React local dev
    'http://localhost:5173'                          // Vite local dev (if applicable)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ===== BOOKING ROUTE =====

app.post('/api/bookings', async (req, res) => {

    try {

        const { studentName, studentEmail, studentPhone, teacherName, timeSlot, message } = req.body;



        console.log('📥 New Booking Received:', {

            studentName,

            studentEmail,

            studentPhone,

            teacherName,

            timeSlot,

            message

        });



        // TODO: Save to your database or send an email alert here



        return res.status(201).json({

            success: true,

            message: 'Booking created successfully!'

        });

    } catch (error) {

        console.error('Error saving booking:', error);

        return res.status(500).json({ success: false, message: 'Server error creating booking' });

    }

});



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
