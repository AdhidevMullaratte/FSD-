const { getAppointmentDB } = require('../config/dbAppointment');
const mongoose = require('mongoose');

// Get the active connection
const appointmentDB = getAppointmentDB();

if (!appointmentDB) {
  throw new Error('Appointment database connection not established');
}

const appointmentSchema = new mongoose.Schema({
  doctorName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Create compound index
appointmentSchema.index({ doctorName: 1, date: 1, time: 1 }, { unique: true });

module.exports = appointmentDB.model('Appointment', appointmentSchema);