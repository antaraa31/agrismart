const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { fetchAgriNews } = require('./newsService');
const { detectPestOutbreak } = require('./pestService');
const { generateDecisions } = require('./decisionEngine');
const { executeActions } = require('./actionService');

const profilesPath = path.join(__dirname, '../data/profiles.json');

let agentInterval = null;
const lastRunByProfile = new Map();
const COOLDOWN_MS = 2 * 60 * 60 * 1000;

const loadProfiles = () => {
  try {
    const raw = fs.readFileSync(profilesPath, 'utf-8');
    const profiles = JSON.parse(raw);
    if (!Array.isArray(profiles)) return [];
    return profiles;
  } catch (err) {
    console.error('[AGENT] Failed to load profiles:', err.message);
    return [];
  }
};

const runOne = async (profile, forceRun) => {
  const now = Date.now();
  const last = lastRunByProfile.get(profile.id) || 0;
  if (!forceRun && now - last < COOLDOWN_MS) {
    const minutesLeft = Math.round((COOLDOWN_MS - (now - last)) / 60000);
    console.log(`[AGENT LOOP] Cooldown for ${profile.id}. Next run in ~${minutesLeft} mins.`);
    return;
  }

  const locStr = profile.region ? `${profile.city}, ${profile.region}` : profile.city;
  console.log(`\n[AGENT LOOP] Cycle for ${locStr} - Crop: ${profile.crop}`);
  try {
    const port = process.env.PORT || 5000;
    const weatherQuery = profile.lat && profile.lon
      ? `lat=${encodeURIComponent(profile.lat)}&lon=${encodeURIComponent(profile.lon)}`
      : `city=${encodeURIComponent(profile.city)}`;
    const weatherResponse = await axios.get(`http://localhost:${port}/api/weather?${weatherQuery}`);
    const weatherData = weatherResponse.data.data;
    console.log(`[AGENT LOOP] Weather: ${weatherData.temperature}°C, ${weatherData.humidity}% humidity.`);

    const newsData = await fetchAgriNews(profile.city);
    console.log(`[AGENT LOOP] News items: ${newsData.length}`);

    const pestRisk = await detectPestOutbreak(weatherData.temperature, weatherData.humidity, profile.crop, profile.city);
    console.log(`[AGENT LOOP] Pest: ${pestRisk.likelyPest} (Risk: ${pestRisk.riskLevel})`);

    const environmentalContext = {
      profile,
      weather: weatherData,
      pest: pestRisk,
      news: newsData,
      timestamp: new Date().toISOString()
    };

    console.log('[AGENT LOOP] Generating Context-Aware Decision...');
    const decisions = await generateDecisions(environmentalContext);

    if (decisions.length === 0) {
      console.log('[AGENT LOOP] No immediate critical interventions required.');
    } else {
      console.log(`[AGENT LOOP] Generated ${decisions.length} decision(s). Executing...`);
      executeActions(decisions);
    }

    lastRunByProfile.set(profile.id, Date.now());
  } catch (error) {
    console.error(`[AGENT LOOP] Error for ${profile.id}:`, error.message);
  }
};

const runAgentCycle = async (forceRun = false) => {
  const profiles = loadProfiles();
  if (profiles.length === 0) {
    console.log('[AGENT] No profiles configured — set one in the app to start receiving recommendations.');
    return;
  }
  for (const profile of profiles) {
    await runOne(profile, forceRun);
  }
};

const startAgent = (intervalMinutes = 120) => {
  if (agentInterval) clearInterval(agentInterval);
  console.log(`[AGENT] Initializing Dynamic Location-Aware Loop (Interval: ${intervalMinutes} minutes)`);
  runAgentCycle(true);
  agentInterval = setInterval(() => { runAgentCycle(false); }, intervalMinutes * 60 * 1000);
};

const stopAgent = () => {
  if (agentInterval) {
    clearInterval(agentInterval);
    agentInterval = null;
    console.log('[AGENT] Background Loop Stopped.');
  }
};

module.exports = {
  startAgent,
  stopAgent,
  runAgentCycle
};
