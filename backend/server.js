require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Routes
const weatherRoutes = require('./routes/weather');
const recommendRoutes = require('./routes/recommend');
const adviceRoutes = require('./routes/advice');
const agentRoutes = require('./routes/agent');
const diseaseRoutes = require('./routes/disease');
const pestRoutes = require('./routes/pest');
const newsRoutes = require('./routes/news');
const smartAdviceRoutes = require('./routes/smartAdvice');

// Initialize Express App
const app = express();
const { startAgent } = require('./services/agentService');
app.use(express.json());

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'AgriSmart Backend API is running smoothly.',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/advice', adviceRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/disease-detect', diseaseRoutes);
app.use('/api/pest-alert', pestRoutes);
app.use('/api/agri-news', newsRoutes);
app.use('/api/smart-advice', smartAdviceRoutes);

// Port configuration
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`[Server] AgriSmart Backend running on port ${PORT}`);
    // Initialize the autonomous background agent loop (every 120 minutes)
    startAgent(120);
});
