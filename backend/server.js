require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const { connectAppointmentDB } = require('./config/dbAppointment');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    // Connect to main DB
    console.log('Connecting to main database...');
    await connectDB();

    // Connect to appointment DB
    console.log('Connecting to appointment database...');
    await connectAppointmentDB();

    console.log('Main DB state:', mongoose.connection.readyState);
    console.log('Appointment DB state:', require('./config/dbAppointment').getAppointmentDB().readyState);

    // Import other routes
    const authRoutes = require('./routes/authRoutes');
    const appointmentRoutes = require('./routes/appointments');

    app.use('/api/auth', authRoutes);
    app.use('/api/appointments', appointmentRoutes);

    // Chatbot route
    app.post('/api/chatbot/generate', async (req, res) => {
      const { prompt, stream } = req.body;
      const model = "llama3:8b"; // ✅ hardcoded model name

      try {
        console.log("Received prompt:", prompt);

        const response = await axios.post("http://localhost:11434/api/generate", {
          model,
          prompt,
          stream
        });

        console.log("Response from Ollama:", response.data);

        if (response.data && response.data.response) {
          return res.json({ response: response.data.response });
        } else {
          return res.status(500).json({ error: "Received an empty response from the AI model" });
        }
      } catch (error) {
        console.error("Error in chatbot API:", error.message);
        res.status(500).json({ error: "Failed to generate response from chatbot" });
      }
    });

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`- Main DB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`- Appointment DB: ${require('./config/dbAppointment').getAppointmentDB().readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();
