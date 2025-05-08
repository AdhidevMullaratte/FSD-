const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');

const auth = async (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Get available slots
router.get('/', auth, async (req, res) => {
  try {
    const { doctor, date } = req.query;
    const appointments = await Appointment.find({ 
      doctorName: doctor,
      date: date
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Create appointment
router.post('/', auth, async (req, res) => {
  const { doctorName, date, time } = req.body;
  const userId = req.user.id;

  try {
    const newAppointment = new Appointment({
      doctorName,
      date,
      time,
      user: userId
    });

    await newAppointment.save();
    res.status(201).json({ 
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

module.exports = router;