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
  const { name, age, gender, weeks } = req.body;

  if (!req.files?.beforeImage || !req.files?.afterImage) {
    return res.status(400).json({ error: 'Both before and after images are required.' });
  }

  const beforeBuffer = req.files.beforeImage[0].buffer;
  const afterBuffer = req.files.afterImage[0].buffer;

  const beforeBase64 = beforeBuffer.toString('base64');
  const afterBase64 = afterBuffer.toString('base64');

  const payload = {
    name,
    age,
    gender,
    weeks,
    before_image: beforeBase64,
    after_image: afterBase64
  };

  const pythonScriptPath = path.join(__dirname, '../python-scripts/track_vitiligo.py');
  const python = spawn('python3', [pythonScriptPath]);

  let output = '';
  let errorOutput = '';

  python.stdout.on('data', (data) => {
    output += data.toString();
    console.log('PYTHON STDOUT:', data.toString());
  });

  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('PYTHON STDERR:', data.toString());
  });

  python.stdin.write(JSON.stringify(payload));
  python.stdin.end();

  python.on('close', (code) => {
    if (code !== 0) {
      console.error("Python script error:", errorOutput);
      return res.status(500).json({ error: 'Python script failed.' });
    }

    try {
      const parsed = JSON.parse(output);
      const reportPath = parsed.report_path;

      console.log("Trying to download:", reportPath);

      fs.access(reportPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error("File does not exist:", reportPath);
          return res.status(404).json({ error: "Generated report not found." });
        }

        res.download(reportPath, `${name}_vitiligo_report.docx`, (err) => {
          if (err) {
            console.error("Download error:", err);
            return res.status(500).send("Failed to send file.");
          }

          fs.unlink(reportPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Failed to delete report file:", unlinkErr);
            } else {
              console.log("Report file deleted successfully");
            }
          });
        });
      });
    } catch (e) {
      console.error("Parsing output failed:", output);
      res.status(500).json({ error: 'Failed to parse Python output.' });
    }
  });
});

module.exports = router;