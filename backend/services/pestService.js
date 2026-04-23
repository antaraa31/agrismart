const { fetchPestNews } = require('./newsService');

/**
 * STEP 4: Dynamic Pest Detection (No Hardcoding)
 * Completely eliminates the hardcoded CROP_PESTS dictionary.
 * Uses environmental metrics and real-time news to infer the threat.
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
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
};

const detectPestOutbreak = async (temperature, humidity, crop, location) => {
  // 1. Fetch real-time news alerts using dynamic location
  const newsAlerts = await fetchPestNews(crop, location);
  const hasNewsAlert = newsAlerts && newsAlerts.length > 0;
  
  // 2. Calculate Quantitative Score
  const riskScore = calculateRiskScore(temperature, humidity, hasNewsAlert);
  const riskLevel = mapScoreToLevel(riskScore);
  
  // 3. Dynamic Inference (NO DICTIONARY)
  let likelyPest = "General Agricultural Pest";
  
  // Check if news already explicitly detected a pest
  if (hasNewsAlert && newsAlerts[0].pestType !== "General Pest/Disease") {
    likelyPest = newsAlerts[0].pestType;
  } else {
    // Infer based on weather matrices
    if (humidity >= 75 && temperature >= 25) {
      likelyPest = "Fungal Pathogens / Blight";
    } else if (temperature >= 32 && humidity < 50) {
      likelyPest = "Spider Mites / Whiteflies";
    } else if (temperature >= 20 && humidity >= 60) {
      likelyPest = "Aphids / Stem Borers";
    }
  }

  return {
    score: riskScore,
    riskLevel,
    likelyPest,
    newsAlertActive: hasNewsAlert
  };
};

module.exports = {
  detectPestOutbreak
};
