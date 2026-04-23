const express = require('express');
const multer = require('multer');
const { analyzeLeafImage } = require('../services/aiService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /api/disease-detect
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image file uploaded in the "image" field' });
    }
    const { buffer, mimetype } = req.file;
    const analysisResult = await analyzeLeafImage(buffer, mimetype);
    res.status(200).json({ status: 'success', data: analysisResult });
  } catch (error) {
    console.error('Disease Detection Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze the image'
    });
  }
});

module.exports = router;
