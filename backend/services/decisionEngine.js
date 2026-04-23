const aiService = require('./aiService');

let decisionMemory = [];

// Actions per pest family x risk level. Used only when OpenAI is unreachable.
const ACTION_LIBRARY = {
  'Fall Armyworm': {
    HIGH: ['Apply Spinetoram 11.7% SC or Chlorantraniliprole 18.5% SC immediately', 'Deploy pheromone traps (5 per acre)', 'Destroy severely infested crop residue'],
    MEDIUM: ['Apply Neem oil (1500 ppm) at 5ml/liter', 'Scout fields at dawn or dusk for egg masses'],
    LOW: ['Monitor weekly for egg masses', 'Encourage natural predators like Trichogramma wasps'],
  },
  Locust: {
    HIGH: ['Contact local agricultural department for swarm tracking', 'Apply Malathion 50% EC if a swarm lands', 'Use loud noises to deter settling'],
    MEDIUM: ['Monitor regional news for swarm vectors', 'Prepare pesticide reserves'],
    LOW: ['Track regional weather patterns that carry swarms', 'Check news weekly'],
  },
  'Fungal Pathogens / Blight': {
    HIGH: ['Apply systemic fungicide (Metalaxyl + Mancozeb) immediately', 'Improve field drainage', 'Halt overhead irrigation'],
    MEDIUM: ['Apply protective fungicide (Chlorothalonil)', 'Monitor lower canopy for spots'],
    LOW: ['Ensure good plant spacing for aeration', 'Avoid evening irrigation to keep canopy dry'],
  },
  'Spider Mites / Whiteflies': {
    HIGH: ['Apply miticide (Spiromesifen)', 'Ensure crops are not water-stressed', 'Remove heavily infested leaves'],
    MEDIUM: ['Use insecticidal soap or horticultural oil', 'Spray undersides of leaves in the morning'],
    LOW: ['Maintain adequate irrigation to prevent heat stress', 'Inspect leaf undersides weekly'],
  },
  'Aphids / Stem Borers': {
    HIGH: ['Apply systemic insecticide (Imidacloprid)', 'Remove and destroy damaged shoots', 'Deploy yellow sticky traps'],
    MEDIUM: ['Apply Neem oil (1500 ppm)', 'Introduce lady beetles or lacewings'],
    LOW: ['Scout fields weekly for aphid colonies', 'Keep field borders weed-free'],
  },
  General: {
    HIGH: ['Apply broad-spectrum control immediately', 'Isolate affected crop areas', 'Consult local agricultural extension office'],
    MEDIUM: ['Apply Neem oil spray', 'Increase field scouting frequency to every 2 days'],
    LOW: ['Maintain standard preventative care', 'Keep field borders weed-free', 'Monitor weekly'],
  },
};

const getStatus = (riskLevel) => {
  if (riskLevel === 'HIGH') return 'CRITICAL';
  if (riskLevel === 'MEDIUM') return 'WARNING';
  return 'STABLE';
};

const calculateConfidence = (pestScore, hasNews, temp, humidity) => {
  let confidence = 50;
  if (pestScore > 60) confidence += 15;
  if (hasNews) confidence += 20;
  if (temp > 35 || humidity > 80) confidence += 10;
  return Math.min(Math.max(confidence, 40), 98);
};

const generateReasoning = (weather, likelyPest, hasNews) => {
  const tempPart = weather.temperature > 30
    ? `High temperature (${weather.temperature}°C)`
    : `Moderate temperature (${weather.temperature}°C)`;
  const humPart = weather.humidity > 60
    ? `humid (${weather.humidity}%)`
    : `dry (${weather.humidity}%)`;
  let reasoning = `${tempPart} and ${humPart} conditions `;
  if (/(Mite|Whitefl)/.test(likelyPest)) reasoning += 'favor rapid insect multiplication and heat stress.';
  else if (/(Fungal|Blight)/.test(likelyPest)) reasoning += 'create an optimal breeding ground for moisture-loving pathogens.';
  else reasoning += `elevate the risk for ${likelyPest} activity.`;
  if (hasNews) reasoning += ' Corroborated by active local news reports.';
  return reasoning;
};

const pickActions = (pestName, riskLevel) => {
  for (const key of Object.keys(ACTION_LIBRARY)) {
    if (pestName.toLowerCase().includes(key.toLowerCase())) return ACTION_LIBRARY[key][riskLevel];
  }
  return ACTION_LIBRARY.General[riskLevel];
};

const generateDeterministicDecision = (context) => {
  const { profile, weather, pest } = context;
  if (!profile?.city || !profile?.crop) {
    throw new Error('profile with city and crop is required');
  }
  const locationString = profile.region ? `${profile.city}, ${profile.region}` : profile.city;
  const pestRiskLevel = pest.riskLevel;
  const pestName = pest.likelyPest;

  const actions = pickActions(pestName, pestRiskLevel);
  const alerts = [];
  if (pestRiskLevel === 'HIGH') {
    alerts.push('Immediate attention required');
    alerts.push(`High ${pestName} activity likely in your area`);
  } else if (pestRiskLevel === 'MEDIUM') {
    alerts.push(`Elevated conditions for ${pestName} development`);
  }

  const confValue = calculateConfidence(pest.score, pest.newsAlertActive, weather.temperature, weather.humidity);

  const decisions = [{
    status: getStatus(pestRiskLevel),
    location: locationString,
    crop: profile.crop,
    riskLevel: pestRiskLevel,
    detectedThreat: pestRiskLevel === 'LOW' ? `None detected (monitoring for ${pestName})` : pestName,
    confidence: `${confValue}%`,
    reasoning: generateReasoning(weather, pestName, pest.newsAlertActive),
    actions,
    alerts,
    timestamp: new Date().toISOString(),
  }];

  if (weather.description && /rain/i.test(weather.description) && pestRiskLevel !== 'HIGH') {
    decisions.push({
      status: 'WARNING',
      location: locationString,
      crop: profile.crop,
      riskLevel: 'MEDIUM',
      detectedThreat: 'Rainfall / Waterlogging',
      confidence: '90%',
      reasoning: `Forecast indicates ${weather.description}. Excess moisture can damage soil structure if not managed.`,
      actions: ['Delay scheduled irrigation by 24-48 hours', 'Clear field drainage channels'],
      alerts: ['Impending rainfall expected'],
      timestamp: new Date().toISOString(),
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
    decisions.forEach((d) => decisionMemory.push(d));
    if (decisionMemory.length > 20) decisionMemory = decisionMemory.slice(-20);
  }
  return decisions;
};

const getDecisionMemory = () => decisionMemory;

module.exports = {
  generateDecisions,
  generateDeterministicDecision,
  getDecisionMemory,
};
