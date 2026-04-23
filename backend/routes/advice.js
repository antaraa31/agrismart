const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// GET /api/advice
// Generate AI-based advisory based on environmental conditions
router.get('/', async (req, res) => {
  try {
    const { temperature, humidity, soilType, crop } = req.query;

    if (!temperature || !humidity || !crop) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide temperature, humidity, and crop query parameters'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ status: 'error', message: 'Gemini API Key not configured in .env' });
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are an expert AI Agronomist for the AgriSmart platform.
      Given the following environmental conditions for growing ${crop}:
      - Temperature: ${temperature}°C
      - Humidity: ${humidity}%
      - Soil Type: ${soilType || 'Unknown'}

      Provide a brief, professional, and actionable advisory for the farmer. 
      Limit your response to 3-4 sentences. Focus on irrigation, fertilizer, or risk of diseases based on these conditions.
      Do not use markdown formatting, keep it plain text.
    `;

    const result = await model.generateContent(prompt);
    const advice = result.response.text().trim();

    res.status(200).json({
      status: 'success',
      data: {
        crop,
        conditions: { temperature, humidity, soilType },
        advice
      }
    });

  } catch (error) {
    console.error('AI Advisory Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate AI advice'
    });
  }
});

module.exports = router;
