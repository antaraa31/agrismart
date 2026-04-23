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
  let query;
  if (lat && lon) query = `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  else if (city) query = `city=${encodeURIComponent(city)}`;
  else throw new Error('city or lat/lon is required');
  const r = await axios.get(`${baseUrl()}/weather?${query}`);
  return r.data.data;
};

const buildProfile = ({ weather, crop, city, region }) => {
  if (!crop) throw new Error('crop is required');
  const resolvedCity = (city && String(city).trim()) || weather?.city;
  if (!resolvedCity) throw new Error('city is required');
  return {
    city: resolvedCity,
    region: region ? String(region).trim() : '',
    lat: '',
    lon: '',
    crop: String(crop).trim(),
  };
};

// GET /api/advice?city=<city>&crop=<crop>&mode=quick
// GET /api/advice?lat=<lat>&lon=<lon>&crop=<crop>&mode=quick
router.get('/', async (req, res) => {
  try {
    const { city, lat, lon, crop, region, mode = 'quick' } = req.query;
    if (!crop) return res.status(400).json({ status: 'error', message: 'crop is required' });
    if (!city && !(lat && lon)) return res.status(400).json({ status: 'error', message: 'city or lat/lon is required' });

    const weather = await fetchWeather({ city, lat, lon });
    const pest = await detectPestOutbreak(weather.temperature, weather.humidity, crop, weather.city);
    const news = await fetchAgriNews(weather.city);
    const profile = buildProfile({ weather, crop, city, region });
    const context = { profile, weather, pest, news };

    let decision;
    if (aiService.isEnabled()) {
      try {
        decision = await aiService.generateAdvice(context, mode === 'full' ? 'full' : 'quick');
      } catch (err) {
        console.error('[/api/advice GET] AI generation failed:', err.message);
        decision = generateDeterministicDecision(context)[0];
      }
    } else {
      decision = generateDeterministicDecision(context)[0];
    }

    decision.timestamp = new Date().toISOString();
    res.status(200).json({
      status: 'success',
      data: { decision, weather, pest, newsCount: news.length },
    });
  } catch (error) {
    console.error('Advice (GET) Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message || 'Failed to generate advice',
    });
  }
});

// POST /api/advice  (multipart/form-data)
// fields: city, crop [, region, lat, lon, mode=full, image]
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { city, crop, region, lat, lon, mode = 'full' } = req.body;
    if (!crop) return res.status(400).json({ status: 'error', message: 'crop is required' });
    if (!city && !(lat && lon)) return res.status(400).json({ status: 'error', message: 'city or lat/lon is required' });

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

    const profile = buildProfile({ weather, crop, city, region });
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
          summary: 'Operating in fallback mode. AI synthesis unavailable; recommendations are rule-based.',
        };
      }
    } else {
      const fallback = generateDeterministicDecision(context)[0];
      decision = {
        ...fallback,
        irrigationPlan: { nextAction: 'Maintain current irrigation schedule', windowHours: 24, notes: 'OpenAI key not configured.' },
        schemes: [],
        summary: 'AI synthesis not configured; showing rule-based recommendations only.',
      };
    }
    decision.timestamp = new Date().toISOString();

    res.status(200).json({
      status: 'success',
      data: {
        decision,
        rawIntelligence: { weather, pest, disease, news },
      },
    });
  } catch (error) {
    console.error('Advice (POST) Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message || 'Failed to generate full advice',
    });
  }
});

module.exports = router;
