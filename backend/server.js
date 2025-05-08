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

// Use memory storage for file uploads to access buffers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

    // Tracking route - Fixed version
    app.post('/api/tracking', upload.fields([
      { name: 'beforeImage', maxCount: 1 },
      { name: 'afterImage', maxCount: 1 }
    ]), async (req, res) => {
      try {
        // Verify all required data exists
        if (!req.files?.beforeImage || !req.files?.afterImage) {
          return res.status(400).json({ error: 'Both before and after images are required' });
        }

        // Verify files have buffers
        const beforeFile = req.files.beforeImage[0];
        const afterFile = req.files.afterImage[0];
        
        if (!beforeFile.buffer || !afterFile.buffer) {
          return res.status(400).json({ error: 'Invalid file upload' });
        }

        // Prepare the payload for Python
        const payload = {
          before_image: beforeFile.buffer.toString('base64'),
          after_image: afterFile.buffer.toString('base64'),
          weeks: req.body.weeks,
          name: req.body.name,
          age: req.body.age,
          gender: req.body.gender
        };

        // Debug log
        console.log('Received tracking request for:', payload.name);
        console.log('Image sizes - before:', beforeFile.size, 'after:', afterFile.size);

        // Execute Python script
        const pythonScriptPath = path.join(__dirname, 'python-scripts/track_vitiligo.py');
        const python = spawn('python3', [pythonScriptPath]);

        let result = '';
        let pythonError = '';

        python.stdout.on('data', (data) => {
          result += data.toString();
        });

        python.stderr.on('data', (data) => {
          pythonError += data.toString();
          console.error('Python error:', data.toString());
        });

        python.stdin.write(JSON.stringify(payload));
        python.stdin.end();

        python.on('close', (code) => {
          console.log(`Python process exited with code ${code}`);
          
          if (code !== 0) {
            return res.status(500).json({ 
              error: 'Python script failed',
              details: pythonError 
            });
          }

          try {
            const parsedResult = JSON.parse(result);
            
            if (!parsedResult.report_path) {
              throw new Error('Python script did not return report path');
            }

            console.log('Generated report at:', parsedResult.report_path);
            
            // Send the file and clean up
            res.download(
              parsedResult.report_path, 
              `${payload.name}_vitiligo_report.docx`,
              (err) => {
                if (err) {
                  console.error('Download failed:', err);
                  return res.status(500).json({ error: 'Failed to send file' });
                }
                // Clean up the file
                fs.unlink(parsedResult.report_path, (unlinkErr) => {
                  if (unlinkErr) console.error('Cleanup failed:', unlinkErr);
                });
              }
            );
          } catch (e) {
            console.error('Result parsing error:', e);
            console.log('Raw Python output:', result);
            res.status(500).json({ 
              error: 'Failed to process results',
              details: e.message 
            });
          }
        });

      } catch (err) {
        console.error('Tracking route error:', err);
        res.status(500).json({ 
          error: 'Internal server error',
          details: err.message 
        });
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

// Start with default port or .env configuration
startServer();