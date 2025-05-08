require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Main DB connected to: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('Main DB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;