const express = require('express');
const { fetchAgriNews } = require('../services/newsService');

const router = express.Router();

// GET /api/agri-news
// Fetch Indian Government Schemes and Agriculture News
router.get('/', async (req, res) => {
  try {
    // Call the intelligent news service
    const newsData = await fetchAgriNews();

    res.status(200).json({
      status: 'success',
      data: newsData
    });

  } catch (error) {
    console.error('Agri-News Route Error:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to fetch agriculture news and schemes.' 
    });
  }
});

module.exports = router;
