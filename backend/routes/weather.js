const express = require('express');
const axios = require('axios');
const { withCache } = require('../services/cache');
const cacheControl = require('../middleware/cacheControl');

const router = express.Router();

// OpenWeather conditions rarely change faster than every few minutes
const TTL_MS = 5 * 60 * 1000;
const HTTP_MAX_AGE = 300; // seconds — matches TTL

const fetchFromOpenWeather = async ({ city, lat, lon }) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY not configured');
  const base = 'https://api.openweathermap.org/data/2.5/weather';
  const url = lat && lon
    ? `${base}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=metric`
    : `${base}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const r = await axios.get(url);
  return {
    temperature: r.data.main.temp,
    humidity: r.data.main.humidity,
    description: r.data.weather[0].description,
    windSpeed: r.data.wind.speed,
    city: r.data.name,
    country: r.data.sys.country,
  };
};

// GET /api/weather?city=...  OR  /api/weather?lat=..&lon=..
router.get('/', cacheControl(HTTP_MAX_AGE), async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    if (!lat && !lon && !city) {
      return res.status(400).json({ status: 'error', message: 'Please provide a city or lat/lon coordinates' });
    }
    const key = lat && lon
      ? `coords:${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`
      : `city:${String(city).trim().toLowerCase()}`;
    const data = await withCache('weather', key, TTL_MS, () => fetchFromOpenWeather({ city, lat, lon }));
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('Weather API Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || 'Failed to fetch weather data',
    });
  }
});

module.exports = router;
