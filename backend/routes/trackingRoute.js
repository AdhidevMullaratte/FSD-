const express = require('express');
const router = express.Router();
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/tracking', upload.fields([
  { name: 'beforeImage', maxCount: 1 },
  { name: 'afterImage', maxCount: 1 }
]), (req, res) => {
  console.log('\n==== NEW TRACKING REQUEST ====');
  console.log('Request body fields:', Object.keys(req.body));
  console.log('Request files:', req.files ? Object.keys(req.files) : 'None');

  try {
    const { name, age, gender, weeks } = req.body;
    console.log('Patient data:', { name, age, gender, weeks });

    if (!req.files?.beforeImage || !req.files?.afterImage) {
      console.error('Missing images - before:', !!req.files?.beforeImage, 'after:', !!req.files?.afterImage);
      return res.status(400).json({ error: 'Both before and after images are required.' });
    }

    console.log('Converting images to base64...');
    const beforeBase64 = req.files.beforeImage[0].buffer.toString('base64');
    const afterBase64 = req.files.afterImage[0].buffer.toString('base64');
    console.log('Base64 lengths - before:', beforeBase64.length, 'after:', afterBase64.length);

    const payload = {
      name,
      age,
      gender,
      weeks,
      before_image: beforeBase64,
      after_image: afterBase64
    };

    const pythonScriptPath = path.join(__dirname, '../python-scripts/track_vitiligo.py');
    console.log('Python script path:', pythonScriptPath);
    console.log('Spawning Python process...');

    const python = spawn('python3', [pythonScriptPath]);
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      const dataStr = data.toString();
      console.log('PYTHON STDOUT:', dataStr);
      output += dataStr;
    });

    python.stderr.on('data', (data) => {
      const dataStr = data.toString();
      console.error('PYTHON STDERR:', dataStr);
      errorOutput += dataStr;
    });

    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();

    python.on('close', (code) => {
      console.log('\nPython process closed with code:', code);
      console.log('Complete Python output:', output);
      console.log('Complete Python errors:', errorOutput);

      if (code !== 0) {
        console.error('Python script failed with code:', code);
        return res.status(500).json({ 
          error: 'Python script failed',
          pythonError: errorOutput 
        });
      }

      try {
        console.log('Attempting to parse Python output as JSON...');
        const parsed = JSON.parse(output);
        console.log('Parsed Python output:', parsed);

        if (parsed.status === 'error') {
          console.error('Python reported error:', parsed.message);
          return res.status(500).json({ error: parsed.message });
        }

        const reportPath = parsed.report_path;
        console.log('Report path from Python:', reportPath);

        console.log('Checking if report file exists...');
        fs.access(reportPath, fs.constants.F_OK, (err) => {
          if (err) {
            console.error('Report file access error:', err);
            return res.status(500).json({ 
              error: 'Generated report not found',
              reportPath: reportPath,
              filesInDir: fs.readdirSync(path.dirname(reportPath))
            });
          }

          console.log('Setting up file download...');
          res.download(reportPath, `${name}_vitiligo_report.docx`, (err) => {
            if (err) {
              console.error('Download error:', err);
              return res.status(500).json({ error: 'Failed to send file' });
            }

            console.log('Cleaning up report file...');
            fs.unlink(reportPath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Cleanup error:', unlinkErr);
              } else {
                console.log('Report file successfully deleted');
              }
            });
          });
        });
      } catch (e) {
        console.error('Output parsing error:', e);
        console.log('Raw output that failed to parse:', output);
        res.status(500).json({ 
          error: 'Failed to process Python output',
          rawOutput: output
        });
      }
    });

  } catch (error) {
    console.error('Top-level route error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

module.exports = router;