const express = require('express');
const multer = require('multer');
const { analyzeImage } = require('../services/diseaseService');

const router = express.Router();

// Configure multer to store uploaded files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/disease-detect
// Analyze uploaded image for crop diseases
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image file uploaded in the "image" field' });
    }

    const { buffer, mimetype } = req.file;

    // Call our AI image analysis service
    const analysisResult = await analyzeImage(buffer, mimetype);

    res.status(200).json({
      status: 'success',
      data: analysisResult
    });

  } catch (error) {
    console.error('Disease Detection Error:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to analyze the image' 
    });
  }
});

module.exports = router;
