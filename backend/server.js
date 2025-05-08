require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const { connectAppointmentDB } = require('./config/dbAppointment');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Configure uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

const startServer = async (port = process.env.PORT || 5001) => {
  try {
    // Database connections
    console.log('Connecting to databases...');
    await connectDB();
    await connectAppointmentDB();
    console.log('✅ Databases connected successfully');

    // Routes
    const authRoutes = require('./routes/authRoutes');
    const appointmentRoutes = require('./routes/appointments');
    app.use('/api/auth', authRoutes);
    app.use('/api/appointments', appointmentRoutes);

    // Chatbot route
    app.post('/api/chatbot/generate', async (req, res) => {
      try {
        const response = await axios.post("http://localhost:11434/api/generate", {
          model: "llama3:8b",
          prompt: req.body.prompt,
          stream: req.body.stream || false
        });
        res.json(response.data);
      } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Chatbot service unavailable' });
      }
    });

    // Tracking route
    app.post('/api/tracking', upload.fields([
      { name: 'beforeImage', maxCount: 1 },
      { name: 'afterImage', maxCount: 1 }
    ]), async (req, res) => {
      try {
        if (!req.files?.beforeImage || !req.files?.afterImage) {
          return res.status(400).json({ error: 'Both images are required' });
        }

        const python = spawn('python3', [
          path.join(__dirname, 'python-scripts/track_vitiligo.py'),
          req.files.beforeImage[0].path,
          req.files.afterImage[0].path,
          req.body.weeks,
          req.body.name,
          req.body.age,
          req.body.gender
        ]);

        let result = '';
        python.stdout.on('data', (data) => result += data.toString());
        
        python.on('close', (code) => {
          // Cleanup uploaded files
          fs.unlink(req.files.beforeImage[0].path, () => {});
          fs.unlink(req.files.afterImage[0].path, () => {});

          if (code !== 0) return res.status(500).json({ error: 'Analysis failed' });
          res.json(JSON.parse(result));
        });

      } catch (err) {
        console.error('Tracking error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Create server with port conflict handling
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`- Main DB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`- Appointment DB: ${require('./config/dbAppointment').getAppointmentDB().readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying port ${Number(port) + 1}...`);
        startServer(Number(port) + 1);
      } else {
        console.error('Server error:', e);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};
app.post('/api/tracking', upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), async (req, res) => {
  try {
    // Verify all required data exists
    if (!req.files?.beforeImage || !req.files?.afterImage) {
      return res.status(400).json({ error: 'Missing image files' });
    }

    // Prepare the payload for Python
    const payload = {
      before_image: req.files.beforeImage[0].buffer.toString('base64'),
      after_image: req.files.afterImage[0].buffer.toString('base64'),
      weeks: req.body.weeks,
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender
    };

    // Execute Python script
    const python = spawn('python3', [
      path.join(__dirname, 'python-scripts/track_vitiligo.py')
    ]);

    let result = '';
    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
    });

    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();

    python.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Python script failed' });
      }

      try {
        const { report_path } = JSON.parse(result);
        
        // Read the generated file and send it
        res.download(report_path, `${payload.name}_vitiligo_report.docx`, (err) => {
          // Clean up the file after sending
          if (err) console.error('Download error:', err);
          fs.unlink(report_path, () => {});
        });
      } catch (e) {
        console.error('Result parsing error:', e);
        res.status(500).json({ error: 'Failed to process results' });
      }
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Start with default port or .env configuration
startServer();