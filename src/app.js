const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BeSpellBee API is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('BeSpellBee API is running');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
