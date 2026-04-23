const express = require('express');
const axios = require('axios');
const multer = require('multer');
const aiService = require('../services/aiService');
const { detectPestOutbreak } = require('../services/pestService');
const { fetchAgriNews } = require('../services/newsService');
const { generateDeterministicDecision } = require('../services/decisionEngine');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const baseUrl = () => `http://localhost:${process.env.PORT || 5000}/api`;

const fetchWeather = async ({ city, lat, lon }) => {
  const params = [];
  if (lat && lon) { params.push(`lat=${lat}`, `lon=${lon}`); }
  else if (city) { params.push(`city=${encodeURIComponent(city)}`); }
  else { throw new Error('city or lat/lon required'); }
  const r = await axios.get(`${baseUrl()}/weather?${params.join('&')}`);
  return r.data.data;
};

const buildProfile = ({ weather, crop, city, region }) => ({
  city: city || weather?.city || 'Unknown',
  region: region || '',
  lat: '', lon: '',
  crop: crop || 'Unknown'
});

// GET /api/advice?mode=quick&city=Pune&crop=Cotton
// GET /api/advice?mode=quick&lat=18.52&lon=73.85&crop=Cotton
router.get('/', async (req, res) => {
  try {
    const { city, lat, lon, crop = 'General', mode = 'quick' } = req.query;
    if (!city && !(lat && lon)) {
      return res.status(400).json({ status: 'error', message: 'Provide city or lat/lon' });
    }

    const weather = await fetchWeather({ city, lat, lon });
    const pest = await detectPestOutbreak(weather.temperature, weather.humidity, crop, weather.city);
    const news = await fetchAgriNews(weather.city);
    const profile = buildProfile({ weather, crop, city });
    const context = { profile, weather, pest, news };

    let decision;
    if (aiService.isEnabled()) {
      try {
        decision = await aiService.generateAdvice(context, mode === 'full' ? 'full' : 'quick');
      } catch (err) {
        console.error('[/api/advice] AI generation failed:', err.message);
        decision = generateDeterministicDecision(context)[0];
      }
    } else {
      decision = generateDeterministicDecision(context)[0];
    }

    decision.timestamp = new Date().toISOString();
    res.status(200).json({
      status: 'success',
      data: { decision, weather, pest, newsCount: news.length }
    });
  } catch (error) {
    console.error('Advice (GET) Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message || 'Failed to generate advice'
    });
  }
});

// POST /api/advice  (multipart/form-data)  -> mode=full with optional leaf image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { city, crop, lat, lon, mode = 'full' } = req.body;
    if (!crop || (!city && !(lat && lon))) {
      return res.status(400).json({ status: 'error', message: 'crop AND (city OR lat/lon) are required' });
    }

    const weather = await fetchWeather({ city, lat, lon });
    const pest = await detectPestOutbreak(weather.temperature, weather.humidity, crop, weather.city);
    const news = await fetchAgriNews(weather.city);

    let disease = null;
    if (req.file) {
      if (aiService.isEnabled()) {
        try {
          disease = await aiService.analyzeLeafImage(req.file.buffer, req.file.mimetype);
        } catch (err) {
          console.error('[/api/advice POST] Image analysis failed:', err.message);
          disease = { error: 'Image analysis failed', message: err.message };
        }
      } else {
        disease = { error: 'OPENAI_API_KEY not configured' };
      }
    }

    const profile = buildProfile({ weather, crop, city });
    const context = { profile, weather, pest, news, disease };

    let decision;
    if (aiService.isEnabled()) {
      try {
        decision = await aiService.generateAdvice(context, mode === 'quick' ? 'quick' : 'full');
      } catch (err) {
        console.error('[/api/advice POST] AI generation failed:', err.message);
        const fallback = generateDeterministicDecision(context)[0];
        decision = {
          ...fallback,
          irrigationPlan: { nextAction: 'Maintain current irrigation schedule', windowHours: 24, notes: 'AI synthesis unavailable; defaulting to rule-based plan.' },
          schemes: [],
          summary: 'Operating in fallback mode. AI synthesis unavailable; recommendations are rule-based.'
        };
      }
    } else {
      const fallback = generateDeterministicDecision(context)[0];
      decision = {
        ...fallback,
        irrigationPlan: { nextAction: 'Maintain current irrigation schedule', windowHours: 24, notes: 'OpenAI key not configured.' },
        schemes: [],
        summary: 'AI synthesis not configured; showing rule-based recommendations only.'
      };
    }
    decision.timestamp = new Date().toISOString();

    res.status(200).json({
      status: 'success',
      data: {
        decision,
        rawIntelligence: { weather, pest, disease, news }
      }
    });
  } catch (error) {
    console.error('Advice (POST) Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message || 'Failed to generate full advice'
    });
  }
});

module.exports = router;
