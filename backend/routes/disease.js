const express = require('express');
const multer = require('multer');
const { analyzeLeafImage, AIError } = require('../services/aiService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const statusForCode = (code) => {
  if (code === 'no_key') return 503;
  if (code === 'quota') return 402; // Payment Required
  if (code === 'rate_limit') return 429;
  if (code === 'upstream') return 502;
  return 500;
};

// POST /api/disease-detect  (multipart/form-data, field: image)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', code: 'no_file', message: 'No image file uploaded in the "image" field' });
    }
    if (!/^image\//.test(req.file.mimetype)) {
      return res.status(400).json({ status: 'error', code: 'bad_mime', message: 'Uploaded file is not an image.' });
    }
    const { buffer, mimetype } = req.file;
    const data = await analyzeLeafImage(buffer, mimetype);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    if (error instanceof AIError) {
      console.error(`Disease detection [${error.code}]:`, error.message);
      return res.status(statusForCode(error.code)).json({
        status: 'error',
        code: error.code,
        message: error.message,
      });
    }
    console.error('Disease Detection Error:', error.message);
    res.status(500).json({ status: 'error', code: 'unknown', message: error.message || 'Failed to analyze the image' });
  }
});

module.exports = router;
