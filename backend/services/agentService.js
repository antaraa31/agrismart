const axios = require('axios');
const { fetchAgriNews } = require('./newsService');
const { detectPestOutbreak } = require('./pestService');
const { generateDecisions } = require('./decisionEngine');
const { executeActions } = require('./actionService');

// STEP 6: Location-Aware Agent Profile
// In a real database, this would iterate over all registered users
const AGENT_PROFILE = {
  city: 'Pune',
  region: 'Maharashtra',
  lat: '18.5204',
  lon: '73.8567',
  crop: 'Cotton'
};

let agentInterval = null;
let lastRunTimestamp = 0;
const COOLDOWN_MS = 2 * 60 * 60 * 1000; 

/**
 * Optimized Location-Aware Agent Loop
 */
const runAgentCycle = async (forceRun = false) => {
  const now = Date.now();
  
  if (!forceRun && now - lastRunTimestamp < COOLDOWN_MS) {
    const minutesLeft = Math.round((COOLDOWN_MS - (now - lastRunTimestamp)) / 60000);
    console.log(`[AGENT LOOP] Cooldown active. Skipping cycle. Next run in ~${minutesLeft} mins.`);
    return;
  }

  console.log(`\n[AGENT LOOP] Starting autonomous cycle for ${AGENT_PROFILE.city}, ${AGENT_PROFILE.region} - Crop: ${AGENT_PROFILE.crop}`);

  try {
    // 1. Fetch Location-Specific Weather
    const weatherResponse = await axios.get(`http://localhost:5000/api/weather?lat=${AGENT_PROFILE.lat}&lon=${AGENT_PROFILE.lon}`);
    const weatherData = weatherResponse.data.data;
    console.log(`[AGENT LOOP] Hyper-local Weather: ${weatherData.temperature}°C, ${weatherData.humidity}% humidity.`);

    // 2. Fetch Hyper-Local News & Schemes
    const newsData = await fetchAgriNews(AGENT_PROFILE.city);
    console.log(`[AGENT LOOP] Fetched ${newsData.length} local news/schemes items for ${AGENT_PROFILE.city}.`);

    // 3. Dynamic Pest Inference
    const pestRisk = await detectPestOutbreak(weatherData.temperature, weatherData.humidity, AGENT_PROFILE.crop, AGENT_PROFILE.city);
    console.log(`[AGENT LOOP] Inferred Pest Threat: ${pestRisk.likelyPest} (Risk: ${pestRisk.riskLevel})`);

    // Package the context
    const environmentalContext = {
      profile: AGENT_PROFILE,
      weather: weatherData,
      pest: pestRisk,
      news: newsData,
      timestamp: new Date().toISOString()
    };

    console.log('[AGENT LOOP] Generating Context-Aware Decision...');
    
    // 4. Pass to Decision Engine
    const decisions = await generateDecisions(environmentalContext);
    
    if (decisions.length === 0) {
      console.log('[AGENT LOOP] No immediate critical interventions required.');
    } else {
      console.log(`[AGENT LOOP] Generated ${decisions.length} actionable decision(s). Executing actions...`);
      executeActions(decisions);
    }

    lastRunTimestamp = Date.now();

  } catch (error) {
    console.error('[AGENT LOOP] Error during cycle:', error.message);
  }
};

const startAgent = (intervalMinutes = 120) => {
  if (agentInterval) {
    clearInterval(agentInterval);
  }
  
  console.log(`[AGENT] Initializing Dynamic Location-Aware Loop (Interval: ${intervalMinutes} minutes)`);
  
  runAgentCycle(true);

  agentInterval = setInterval(() => {
    runAgentCycle(false);
  }, intervalMinutes * 60 * 1000);
};

const stopAgent = () => {
  if (agentInterval) {
    clearInterval(agentInterval);
    console.log('[AGENT] Background Loop Stopped.');
  }
};

module.exports = {
  startAgent,
  stopAgent,
  runAgentCycle
};
