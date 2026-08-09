const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

// ===== CREATE THE APP FIRST =====
const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    'https://bespellbee.github.io',
    'https://bespellbee.github.io/BeSpellBee',
    'https://bespellbee.github.io/BeSpellBee/',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
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
app.use('/api/auth', authRoutes);

// ===== ANALYTICS ROUTES =====
app.use('/api/analytics', analyticsRoutes);

// ===== BOOKING ROUTE =====
app.post('/api/bookings', async (req, res) => {
  try {
    const { studentName, studentEmail, studentPhone, teacherName, timeSlot, message } = req.body;
    
    if (!studentName || !studentEmail || !teacherName || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentName, studentEmail, teacherName, and timeSlot are required'
      });
    }

    // ===== SAVE TO DATABASE =====
    const Booking = require('./models/Booking');
    const booking = await Booking.create({
      studentName,
      studentEmail,
      studentPhone: studentPhone || null,
      teacherName,
      timeSlot,
      message: message || null
    });

    console.log('📚 New Booking Saved to Database:');
    console.log(`👤 Student: ${studentName} (${studentEmail})`);
    console.log(`👩‍🏫 Teacher: ${teacherName}`);
    console.log(`🕐 Time: ${timeSlot}`);
    console.log(`🆔 Booking ID: ${booking.id}`);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: booking.id,
        student: studentName,
        email: studentEmail,
        teacher: teacherName,
        time_slot: timeSlot
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating booking'
    });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
