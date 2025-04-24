
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class');
const yearRoutes = require('./routes/year');
const subjectRoutes = require('./routes/subject');
const teacherRoutes = require('./routes/teacher');
const timingRoutes = require('./routes/timing');
const classroomRoutes = require('./routes/classroom');
const timetableRoutes = require('./routes/timetable');

// Create Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable-generator')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/years', yearRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/timings', timingRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/timetables', timetableRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Timetable Generator API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : null 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
