const aiService = require('./aiService');

let decisionMemory = [];

const ACTION_LIBRARY = {
  "Fall Armyworm": {
    "HIGH": ["Apply Spinetoram 11.7% SC or Chlorantraniliprole 18.5% SC immediately", "Deploy pheromone traps (5 per acre)", "Destroy severely infested crop residue"],
    "MEDIUM": ["Apply Neem oil (1500 ppm) at 5ml/liter", "Scout fields dynamically at dawn or dusk"],
    "LOW": ["Monitor weekly for egg masses", "Encourage natural predators like Trichogramma wasps"]
  },
  "Locust": {
    "HIGH": ["Contact local agricultural department immediately for regional swarm tracking", "Apply Malathion 50% EC if swarm lands", "Use loud noises/drums to deter settling"],
    "MEDIUM": ["Monitor regional news alerts closely for swarm vectors", "Prepare pesticide reserves"],
    "LOW": ["Stay informed on regional weather patterns that carry swarms", "Check news weekly"]
  },
  "Fungal Pathogens / Blight": {
    "HIGH": ["Apply systemic fungicide (e.g., Metalaxyl + Mancozeb) immediately", "Improve field drainage", "Halt overhead irrigation"],
    "MEDIUM": ["Apply protective fungicide (Chlorothalonil)", "Monitor lower canopy for spots"],
    "LOW": ["Ensure good plant spacing for aeration", "Avoid evening irrigation to keep canopy dry"]
  },
  "Spider Mites / Whiteflies": {
    "HIGH": ["Apply Miticide (e.g., Spiromesifen)", "Ensure crops are not water-stressed", "Remove heavily infested leaves"],
    "MEDIUM": ["Use insecticidal soap or horticultural oil", "Spray undersides of leaves in the morning"],
    "LOW": ["Maintain adequate irrigation to prevent plant heat stress", "Inspect leaf undersides weekly"]
  },
  "General": {
    "HIGH": ["Apply broad-spectrum organic or chemical control immediately", "Isolate affected crop areas", "Consult local agricultural extension office"],
    "MEDIUM": ["Apply Neem oil spray", "Increase field scouting frequency to every 2 days"],
    "LOW": ["Maintain standard preventative care", "Keep field borders weed-free", "Monitor weekly"]
  }
};

const getStatus = (riskLevel) => {
  if (riskLevel === "HIGH") return "CRITICAL";
  if (riskLevel === "MEDIUM") return "WARNING";
  return "STABLE";
};

const calculateConfidence = (pestScore, hasNews, temp, humidity) => {
  let confidence = 50;
  if (pestScore > 60) confidence += 15;
  if (hasNews) confidence += 20;
  if (temp > 35 || humidity > 80) confidence += 10;
  return Math.min(Math.max(confidence, 40), 98);
};

const generateReasoning = (weather, likelyPest, hasNews) => {
  let reasoning = `${weather.temperature > 30 ? `High temperature (${weather.temperature}°C)` : `Moderate temperature (${weather.temperature}°C)`} and ${weather.humidity > 60 ? `humid (${weather.humidity}%)` : `dry (${weather.humidity}%)`} conditions `;
  if (likelyPest.includes('Mite') || likelyPest.includes('Whitefl')) {
    reasoning += "favor rapid insect multiplication and heat stress.";
  } else if (likelyPest.includes('Fungal') || likelyPest.includes('Blight')) {
    reasoning += "create an optimal breeding ground for moisture-loving pathogens.";
  } else {
    reasoning += `elevate the risk for ${likelyPest} activity.`;
  }
  if (hasNews) reasoning += " This is strongly corroborated by active local news reports of outbreaks in your region.";
  return reasoning;
};

const generateDeterministicDecision = (context) => {
  const { profile, weather, pest } = context;
  const locationString = profile.city ? `${profile.city}${profile.region ? ', ' + profile.region : ''}` : "Unknown Location";
  const pestRiskLevel = pest.riskLevel;
  const pestName = pest.likelyPest;

  let targetedActions = ACTION_LIBRARY["General"][pestRiskLevel];
  for (const knownPest in ACTION_LIBRARY) {
    if (pestName.toLowerCase().includes(knownPest.toLowerCase())) {
      targetedActions = ACTION_LIBRARY[knownPest][pestRiskLevel];
      break;
    }
  }

  const additionalActions = [
    "Monitor soil moisture levels regularly",
    "Ensure proper field drainage",
    "Apply organic compost to improve soil health",
    "Check for nutrient deficiencies",
    "Implement crop rotation practices",
    "Use beneficial insects for natural pest control"
  ];
  const shuffled = additionalActions.sort(() => 0.5 - Math.random());
  targetedActions = targetedActions.concat(shuffled.slice(0, Math.floor(Math.random() * 2) + 1));

  const alerts = [];
  if (pestRiskLevel === "HIGH") {
    alerts.push("Immediate attention required");
    alerts.push(`High ${pestName} activity detected in your area`);
  } else if (pestRiskLevel === "MEDIUM") {
    alerts.push(`Elevated conditions for ${pestName} development`);
  }

  const confValue = calculateConfidence(pest.score, pest.newsAlertActive, weather.temperature, weather.humidity);

  const pestDecision = {
    status: getStatus(pestRiskLevel),
    location: locationString,
    crop: profile.crop || "Unknown Crop",
    riskLevel: pestRiskLevel,
    detectedThreat: pestRiskLevel === "LOW" ? "None detected (Monitoring for " + pestName + ")" : pestName,
    confidence: `${confValue}%`,
    reasoning: generateReasoning(weather, pestName, pest.newsAlertActive) + ` (Assessment at ${new Date().toLocaleString()})`,
    actions: targetedActions,
    alerts: alerts,
    timestamp: new Date().toISOString()
  };

  const decisions = [pestDecision];

  if (weather.description && weather.description.toLowerCase().includes('rain') && pestRiskLevel !== "HIGH") {
    decisions.push({
      status: "WARNING",
      location: locationString,
      crop: profile.crop,
      riskLevel: "MEDIUM",
      detectedThreat: "Rainfall / Waterlogging",
      confidence: "90%",
      reasoning: `OpenWeather indicates upcoming ${weather.description}. Excess moisture can damage soil structure if not managed.`,
      actions: ["Delay scheduled irrigation by 24-48 hours", "Ensure field drainage channels are clear"],
      alerts: ["Impending rainfall expected"],
      timestamp: new Date().toISOString()
    });
  }

  return decisions;
};

const generateDecisions = async (context) => {
  console.log('[DECISION ENGINE] Generating decision output...');

  let decisions;
  if (aiService.isEnabled()) {
    try {
      const aiDecision = await aiService.generateAdvice(context, 'quick');
      aiDecision.timestamp = new Date().toISOString();
      decisions = [aiDecision];
    } catch (error) {
      console.error('[DECISION ENGINE] AI generation failed:', error.message);
      console.log('[DECISION ENGINE] Falling back to rule-based decisions');
      decisions = generateDeterministicDecision(context);
    }
  } else {
    console.log('[DECISION ENGINE] OpenAI key missing, using rule-based decisions');
    decisions = generateDeterministicDecision(context);
  }

  if (decisions.length > 0) {
    decisions.forEach(d => decisionMemory.push(d));
    if (decisionMemory.length > 20) decisionMemory = decisionMemory.slice(-20);
  }

  return decisions;
};

const getDecisionMemory = () => decisionMemory;

module.exports = {
  generateDecisions,
  generateDeterministicDecision,
  getDecisionMemory
};
