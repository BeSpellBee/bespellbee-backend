// ===== BOOKING ROUTE =====
// POST /api/bookings
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, phone, teacher, time_slot, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !teacher || !time_slot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, teacher, and time_slot are required'
      });
    }

    // Log the booking (you can replace this with email sending logic later)
    console.log('📚 New Booking Received:');
    console.log(`👤 Student: ${name} (${email})`);
    console.log(`👩‍🏫 Teacher: ${teacher}`);
    console.log(`🕐 Time: ${time_slot}`);
    console.log(`📝 Notes: ${message || 'None'}`);

    // TODO: Send email notification (you can integrate nodemailer or another service)
    // For now, we'll just return success

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        student: name,
        email: email,
        teacher: teacher,
        time_slot: time_slot
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
