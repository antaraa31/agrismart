const { GoogleGenerativeAI } = require('@google/generative-ai');

let decisionMemory = [];

// STEP 2: Upgraded Context-Aware Action Library (including Preventive Mode)
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

/**
 * Calculates a dynamic confidence score based on signal alignment
 */
const calculateConfidence = (pestScore, hasNews, temp, humidity) => {
  let confidence = 50; // Base confidence
  
  // If rule-based score is high, confidence in the detection is higher
  if (pestScore > 60) confidence += 15;
  
  // If local news confirms pest activity, huge confidence boost
  if (hasNews) confidence += 20;
  
  // If weather conditions are extreme, confidence in the environment is high
  if (temp > 35 || humidity > 80) confidence += 10;
  
  return Math.min(Math.max(confidence, 40), 98); // Bound between 40-98%
};

/**
 * Generates human-friendly reasoning
 */
const generateReasoning = (weather, likelyPest, hasNews) => {
  let reasoning = `${weather.temperature > 30 ? `High temperature (${weather.temperature}°C)` : `Moderate temperature (${weather.temperature}°C)`} and ${weather.humidity > 60 ? `humid (${weather.humidity}%)` : `dry (${weather.humidity}%)`} conditions `;
  
  if (likelyPest.includes('Mite') || likelyPest.includes('Whitefl')) {
    reasoning += "favor rapid insect multiplication and heat stress.";
  } else if (likelyPest.includes('Fungal') || likelyPest.includes('Blight')) {
    reasoning += "create an optimal breeding ground for moisture-loving pathogens.";
  } else {
    reasoning += `elevate the risk for ${likelyPest} activity.`;
  }

  if (hasNews) {
    reasoning += " This is strongly corroborated by active local news reports of outbreaks in your region.";
  }

  return reasoning;
};

/**
 * Generates deterministic structured decisions natively (ALWAYS returns output).
 */
const generateDeterministicDecision = (context) => {
  const { profile, weather, pest } = context;
  const locationString = profile.city ? `${profile.city}${profile.region ? ', ' + profile.region : ''}` : "Unknown Location";
  
  const pestRiskLevel = pest.riskLevel;
  const pestName = pest.likelyPest;
  
  // Fetch Actions
  let targetedActions = ACTION_LIBRARY["General"][pestRiskLevel];
  for (const knownPest in ACTION_LIBRARY) {
    if (pestName.toLowerCase().includes(knownPest.toLowerCase())) {
      targetedActions = ACTION_LIBRARY[knownPest][pestRiskLevel];
      break;
    }
  }

  // Add variation: include additional preventive actions
  const additionalActions = [
    "Monitor soil moisture levels regularly",
    "Ensure proper field drainage",
    "Apply organic compost to improve soil health",
    "Check for nutrient deficiencies",
    "Implement crop rotation practices",
    "Use beneficial insects for natural pest control"
  ];
  
  // Randomly add 1-2 additional actions
  const shuffled = additionalActions.sort(() => 0.5 - Math.random());
  targetedActions = targetedActions.concat(shuffled.slice(0, Math.floor(Math.random() * 2) + 1));

  // Compile Alerts
  const alerts = [];
  if (pestRiskLevel === "HIGH") {
    alerts.push("Immediate attention required");
    alerts.push(`High ${pestName} activity detected in your area`);
  } else if (pestRiskLevel === "MEDIUM") {
    alerts.push(`Elevated conditions for ${pestName} development`);
  }

  // Calculate Confidence
  const confValue = calculateConfidence(pest.score, pest.newsAlertActive, weather.temperature, weather.humidity);

  // Generate the Master Object
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

  const decisions = [pestDecision]; // ALWAYS return the primary decision

  // Weather Event Override
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

  return decisions.filter(newDec => {
    // Allow all new decisions to be added
    return true;
  });
};

/**
 * AI-Powered Decision Generation using Gemini
 */
const generateAIDecisions = async (context) => {
  const { profile, weather, pest, news } = context;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('[DECISION ENGINE] Gemini API key not configured, falling back to rule-based decisions');
    return generateDeterministicDecision(context);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are AgriSmart's AI Decision Engine, an expert agricultural AI system.
      
      Context for ${profile.crop} farming in ${profile.city}, ${profile.region}:
      - Weather: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.description}
      - Pest Risk: ${pest.riskLevel} (${pest.likelyPest})
      - Recent News: ${news.slice(0, 3).map(n => n.title).join('; ')}
      - Current Time: ${new Date().toISOString()}
      
      Generate a professional agricultural decision with the following JSON structure.
      IMPORTANT: Even if conditions are similar, provide varied, specific, and actionable recommendations.
      Consider different aspects like irrigation, pest management, soil health, and preventive measures.
      Make the reasoning and actions unique for this specific assessment:
      {
        "status": "CRITICAL|WARNING|STABLE",
        "location": "${profile.city}, ${profile.region}",
        "crop": "${profile.crop}",
        "riskLevel": "${pest.riskLevel}",
        "detectedThreat": "Specific threat description",
        "confidence": "X%",
        "reasoning": "Brief explanation based on conditions and current time",
        "actions": ["Action 1", "Action 2", "Action 3"],
        "alerts": ["Alert 1", "Alert 2"],
        "timestamp": "${new Date().toISOString()}"
      }
      
      Respond ONLY with valid JSON, no markdown or extra text.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean and parse
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const decision = JSON.parse(cleanedText);

    return [decision];
  } catch (error) {
    console.error('[DECISION ENGINE] AI generation failed:', error.message);
    console.log('[DECISION ENGINE] Falling back to rule-based decisions');
    return generateDeterministicDecision(context);
  }
};

const generateDecisions = async (context) => {
  console.log('[DECISION ENGINE] Generating AI-powered decision output...');
  
  const decisions = await generateAIDecisions(context);

  if (decisions.length > 0) {
    decisions.forEach(decision => {
      decisionMemory.push(decision);
    });

    if (decisionMemory.length > 20) decisionMemory = decisionMemory.slice(-20);
  }

  return decisions;
};

const getDecisionMemory = () => decisionMemory;

module.exports = {
  generateDecisions,
  getDecisionMemory
};
