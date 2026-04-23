const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Path to the external rules JSON file
const rulesFilePath = path.join(__dirname, '../data/rules.json');

// GET /api/recommend
// Recommend crops based on temperature, humidity, and optionally soilType
router.get('/', (req, res) => {
  try {
    const { temperature, humidity, soilType } = req.query;

    if (!temperature || !humidity) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please provide both temperature and humidity query parameters' 
      });
    }

    const temp = parseFloat(temperature);
    const hum = parseFloat(humidity);

    // Read and parse rules dynamically (no hardcoded if-else)
    const rulesData = fs.readFileSync(rulesFilePath, 'utf-8');
    const crops = JSON.parse(rulesData);

    // Filter crops based on rules
    const recommendations = crops.filter(crop => {
      const { minTemp, maxTemp, minHumidity, maxHumidity } = crop.conditions;
      
      const isTempValid = temp >= minTemp && temp <= maxTemp;
      const isHumidityValid = hum >= minHumidity && hum <= maxHumidity;
      
      let isSoilValid = true;
      if (soilType && crop.soilType) {
        // If soil type is provided, do a case-insensitive match
        isSoilValid = crop.soilType.toLowerCase() === soilType.toLowerCase();
      }

      return isTempValid && isHumidityValid && isSoilValid;
    });

    if (recommendations.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No suitable crops found for the given conditions.',
        data: []
      });
    }

    res.status(200).json({
      status: 'success',
      data: recommendations
    });

  } catch (error) {
    console.error('Recommendation Error:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to generate crop recommendation' 
    });
  }
});

module.exports = router;
