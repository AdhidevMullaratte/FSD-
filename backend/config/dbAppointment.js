require('dotenv').config();
const mongoose = require('mongoose');

let appointmentDB; // This will hold our connection

const connectAppointmentDB = async () => {
  try {
    if (!process.env.MONGO_URI_APPOINTMENT) {
      throw new Error('MONGO_URI_APPOINTMENT is not defined in .env file');
    }
    
    appointmentDB = mongoose.createConnection(process.env.MONGO_URI_APPOINTMENT);
    
    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      appointmentDB.on('connected', resolve);
      appointmentDB.on('error', reject);
    });
    
    console.log(`Appointment DB connected to: ${process.env.MONGO_URI_APPOINTMENT}`);
    return appointmentDB;
  } catch (err) {
    console.error('Appointment DB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { connectAppointmentDB, getAppointmentDB: () => appointmentDB };