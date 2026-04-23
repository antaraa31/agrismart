const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/weather
// Fetch weather data from OpenWeather API dynamically
router.get('/', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ status: 'error', message: 'OpenWeather API Key not configured in .env' });
    }

    let url = '';
    
    // Support either city name or coordinates
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    } else {
      return res.status(400).json({ status: 'error', message: 'Please provide a city or lat/lon coordinates' });
    }

    const response = await axios.get(url);
    
    // Extract relevant data for agriculture
    const weatherData = {
      temperature: response.data.main.temp,
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
      windSpeed: response.data.wind.speed,
      city: response.data.name,
      country: response.data.sys.country
    };

    res.status(200).json({
      status: 'success',
      data: weatherData
    });
  } catch (error) {
    console.error('Weather API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.response?.data?.message || 'Failed to fetch weather data' 
    });
  }
});

module.exports = router;
