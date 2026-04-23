const express = require('express');
const { detectPestOutbreak } = require('../services/pestService');

const router = express.Router();

// POST /api/pest-alert
// Detect pest outbreaks combining environmental factors and news intel
router.post('/', async (req, res) => {
  try {
    const { temperature, humidity, crop } = req.body;

    if (temperature === undefined || humidity === undefined || !crop) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please provide temperature, humidity, and crop in the JSON body.' 
      });
    }

    // Call the intelligent pest service
    const assessment = await detectPestOutbreak(temperature, humidity, crop);

    res.status(200).json({
      status: 'success',
      data: assessment
    });

  } catch (error) {
    console.error('Pest Detection Route Error:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to perform pest assessment' 
    });
  }
});

module.exports = router;
