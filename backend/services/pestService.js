const { fetchPestNews } = require('./newsService');

/**
 * Pure rule-based pest risk scoring + environmental inference.
 * No mock data — when news is unavailable the likely pest is inferred from weather alone.
 */

const calculateRiskScore = (temperature, humidity, hasNewsAlert) => {
  let score = 0;
  if (temperature >= 25 && temperature <= 32) score += 40;
  else if (temperature > 32 && temperature <= 38) score += 25;
  else if (temperature >= 20 && temperature < 25) score += 20;
  else score += 5;

  if (humidity >= 80) score += 40;
  else if (humidity >= 65) score += 25;
  else if (humidity >= 50) score += 15;
  else score += 5;

  if (hasNewsAlert) score += 20;
  return Math.min(score, 100);
};

const mapScoreToLevel = (score) => {
  if (score >= 75) return 'HIGH';
  if (score >= 45) return 'MEDIUM';
  return 'LOW';
};

const inferFromClimate = (temperature, humidity) => {
  if (humidity >= 75 && temperature >= 25) return 'Fungal Pathogens / Blight';
  if (temperature >= 32 && humidity < 50) return 'Spider Mites / Whiteflies';
  if (temperature >= 20 && humidity >= 60) return 'Aphids / Stem Borers';
  return 'General Agricultural Pest';
};

const detectPestOutbreak = async (temperature, humidity, crop, location) => {
  if (typeof temperature !== 'number' || typeof humidity !== 'number' || !crop) {
    throw new Error('temperature (number), humidity (number) and crop are required');
  }

  const newsAlerts = await fetchPestNews(crop, location || '');
  const hasNewsAlert = Array.isArray(newsAlerts) && newsAlerts.length > 0;

  const riskScore = calculateRiskScore(temperature, humidity, hasNewsAlert);
  const riskLevel = mapScoreToLevel(riskScore);

  let likelyPest;
  if (hasNewsAlert && newsAlerts[0].pestType && newsAlerts[0].pestType !== 'General Pest/Disease') {
    likelyPest = newsAlerts[0].pestType;
  } else {
    likelyPest = inferFromClimate(temperature, humidity);
  }

  return {
    score: riskScore,
    riskLevel,
    likelyPest,
    newsAlertActive: hasNewsAlert,
  };
};

module.exports = {
  detectPestOutbreak,
};
