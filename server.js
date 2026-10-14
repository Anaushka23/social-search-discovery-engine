const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static frontend directly from http://localhost:3000
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/socialSearchDB';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  tlsAllowInvalidCertificates: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('\nTIP: If using MongoDB Atlas, make sure your current IP address is whitelisted (Network Access -> Allow from Anywhere / 0.0.0.0/0).\n');
  });

// Graceful check middleware
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database connecting or unavailable. If using Atlas, check that your IP is whitelisted (0.0.0.0/0).'
    });
  }
  next();
});

app.use('/api/posts', require('./routes/posts'));
app.use('/api/search', require('./routes/search'));
app.use('/api/users', require('./routes/users'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Open in browser: http://localhost:${PORT}`);
});
