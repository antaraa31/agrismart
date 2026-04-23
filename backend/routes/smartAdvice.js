const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/smart-advice
// Final Integration Orchestrator combining Weather, Pests, Disease, and Govt News
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { city, crop } = req.body;

    if (!city || !crop) {
      return res.status(400).json({ status: 'error', message: 'City and crop are required fields in the form-data.' });
    }

    const port = process.env.PORT || 5000;
    const baseUrl = `http://localhost:${port}/api`;

    // 1. Fetch Weather
    const weatherRes = await axios.get(`${baseUrl}/weather?city=${encodeURIComponent(city)}`);
    const weatherData = weatherRes.data.data;
    const { temperature, humidity } = weatherData;

    // 2. Fetch Pest Risk
    const pestRes = await axios.post(`${baseUrl}/pest-alert`, { temperature, humidity, crop });
    const pestData = pestRes.data.data;

    // 3. Fetch Agri News & Schemes
    const newsRes = await axios.get(`${baseUrl}/agri-news`);
    const newsData = newsRes.data.data;

    // 4. Disease Detection (Optional if image provided)
    let diseaseData = null;
    if (req.file) {
      try {
        // Import service directly to avoid complex form-data proxying over Axios
        const { analyzeImage } = require('../services/diseaseService');
        diseaseData = await analyzeImage(req.file.buffer, req.file.mimetype);
      } catch (err) {
        console.error('Disease detection failed in smart-advice:', err.message);
        diseaseData = { error: "Failed to analyze image due to AI limits." };
      }
    }

    // 5. Generate Final Actionable Farmer Advice
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ status: 'error', message: 'Gemini API Key missing.' });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    // Using gemini-1.5-pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are the ultimate AgriSmart Master AI.
      You have gathered comprehensive intelligence for a farmer growing ${crop} in ${city}.
      
      Intelligence:
      - Weather: Temp ${temperature}°C, Humidity ${humidity}%, ${weatherData.description}
      - Pest Risk: ${pestData.riskLevel} (${pestData.likelyPest}). Preventive: ${pestData.preventiveMeasures.join(', ')}
      - Disease Detection: ${diseaseData ? JSON.stringify(diseaseData) : 'No image uploaded / Not analyzed.'}
      - Relevant Govt Schemes: ${JSON.stringify(newsData.slice(0, 2))}
      
      Synthesize all this data into a highly structured, professional, and actionable advice report.
      Format your response beautifully in Markdown. Include headings:
      1. Immediate Threat Assessment (Pests/Diseases)
      2. Weather & Irrigation Plan
      3. Government Schemes to Leverage
      4. Summary Action Plan
    `;

    try {
      const result = await model.generateContent(prompt);
      const actionableAdvice = result.response.text();

      res.status(200).json({
        status: 'success',
        data: {
          rawIntelligence: { weatherData, pestData, diseaseData, newsData },
          actionableAdvice
        }
      });
    } catch (aiError) {
      console.error('Smart Advice AI Error:', aiError.message);
      // Fallback in case the user changes the model or hits a rate limit
      res.status(200).json({
        status: 'success',
        data: {
          rawIntelligence: { weatherData, pestData, diseaseData, newsData },
          actionableAdvice: "### 1. Immediate Threat Assessment\nCurrently relying on fallback data due to AI rate limits or unsupported model version.\n\n### 2. Weather & Irrigation Plan\nMonitor local conditions and irrigate as needed based on the weather data above.\n\n### 3. Government Schemes to Leverage\nCheck local state portals for current agricultural subsidies.\n\n### 4. Summary Action Plan\nMaintain standard crop care protocols."
        }
      });
    }

  } catch (error) {
    console.error('Smart Advice Orchestrator Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate comprehensive smart advice. Please check the logs.'
    });
  }
});

module.exports = router;
