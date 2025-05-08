const mongoose = require('mongoose');

// Define the user schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
  },
  age: {
    type: Number,
  },
  dob: {
    type: Date,
  },
});

// Export the User model
const User = mongoose.model('User', UserSchema);
module.exports = User;
