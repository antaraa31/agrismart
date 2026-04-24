const OpenAI = require('openai');
const { withCache } = require('./cache');

const MODEL = 'gpt-4o-mini';

// Advice can be cached for 10 minutes — weather and pest scores rarely shift meaningfully that fast,
// and this keeps one Dashboard refresh (or a StrictMode double-mount) from burning an OpenAI call.
const ADVICE_TTL_MS = 10 * 60 * 1000;

let _client = null;
const getClient = () => {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') return null;
  _client = new OpenAI({ apiKey });
  return _client;
};

const isEnabled = () => getClient() !== null;

class AIError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AIError';
    this.code = code; // 'no_key' | 'quota' | 'rate_limit' | 'upstream' | 'parse' | 'empty'
  }
}

const translateOpenAIError = (err) => {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();
  if (status === 401) return new AIError('no_key', 'Your OpenAI API key is invalid or missing.');
  if (status === 429 || msg.includes('quota')) {
    return new AIError('quota', 'AI is paused — your OpenAI quota is exhausted. Add billing at platform.openai.com, then try again.');
  }
  if (status === 429) return new AIError('rate_limit', 'Too many AI requests right now. Please try again in a moment.');
  if (status >= 500) return new AIError('upstream', 'OpenAI is temporarily unavailable. Please retry in a moment.');
  return new AIError('upstream', err?.message || 'AI request failed.');
};

const callJSON = async ({ schemaName, schema, messages }) => {
  const client = getClient();
  if (!client) throw new AIError('no_key', 'OpenAI is not configured on this server.');
  let completion;
  try {
    completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, strict: true, schema }
      }
    });
  } catch (err) {
    throw translateOpenAIError(err);
  }
  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new AIError('empty', 'AI returned an empty response.');
  try {
    return JSON.parse(content);
  } catch {
    throw new AIError('parse', 'AI returned an unparseable response.');
  }
};

const newsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          category: { type: 'string', enum: ['scheme', 'pest', 'weather', 'general'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          extractedPest: { type: ['string', 'null'] },
          relevance: { type: 'integer', minimum: 0, maximum: 100 }
        },
        required: ['title', 'category', 'severity', 'extractedPest', 'relevance']
      }
    }
  },
  required: ['items']
};

const classifyNews = async (articles) => {
  if (!isEnabled()) throw new Error('OPENAI_API_KEY not configured');
  const trimmed = articles.slice(0, 10).map(a => ({
    title: a.title || '',
    description: (a.description || '').slice(0, 400)
  }));
  const result = await callJSON({
    schemaName: 'news_classification',
    schema: newsSchema,
    messages: [
      {
        role: 'system',
        content: 'Classify agricultural news. For each article return category (scheme|pest|weather|general), severity (low|medium|high), extractedPest (pest/disease name or null), and relevance 0-100 for a farmer. Preserve the original title exactly.'
      },
      { role: 'user', content: JSON.stringify(trimmed) }
    ]
  });
  return result.items;
};

const leafSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    disease: { type: 'string' },
    confidence: { type: 'integer', minimum: 0, maximum: 100 },
    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
    treatments: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 4
    }
  },
  required: ['disease', 'confidence', 'severity', 'treatments']
};

const analyzeLeafImage = async (buffer, mimeType) => {
  if (!isEnabled()) throw new Error('OPENAI_API_KEY not configured');
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
  return callJSON({
    schemaName: 'leaf_analysis',
    schema: leafSchema,
    messages: [
      {
        role: 'system',
        content: 'You are an expert agricultural plant pathologist. Examine the provided leaf image. Identify the most likely disease (or "Healthy" if no disease), estimate your confidence 0-100, pick severity (low|medium|high), and list 2-4 short, actionable treatments. Pay attention to lesion shape, color, pattern.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this leaf image.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ]
  });
};

const quickDecisionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['CRITICAL', 'WARNING', 'STABLE'] },
    location: { type: 'string' },
    crop: { type: 'string' },
    riskLevel: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
    detectedThreat: { type: 'string' },
    confidence: { type: 'string' },
    reasoning: { type: 'string' },
    actions: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 8 },
    alerts: { type: 'array', items: { type: 'string' } }
  },
  required: ['status', 'location', 'crop', 'riskLevel', 'detectedThreat', 'confidence', 'reasoning', 'actions', 'alerts']
};

const fullAdviceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['CRITICAL', 'WARNING', 'STABLE'] },
    location: { type: 'string' },
    crop: { type: 'string' },
    riskLevel: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
    detectedThreat: { type: 'string' },
    confidence: { type: 'string' },
    reasoning: { type: 'string' },
    actions: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 8 },
    alerts: { type: 'array', items: { type: 'string' } },
    irrigationPlan: {
      type: 'object',
      additionalProperties: false,
      properties: {
        nextAction: { type: 'string' },
        windowHours: { type: 'integer', minimum: 0, maximum: 168 },
        notes: { type: 'string' }
      },
      required: ['nextAction', 'windowHours', 'notes']
    },
    schemes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          why: { type: 'string' },
          url: { type: 'string' }
        },
        required: ['title', 'why', 'url']
      }
    },
    summary: { type: 'string' }
  },
  required: ['status', 'location', 'crop', 'riskLevel', 'detectedThreat', 'confidence', 'reasoning', 'actions', 'alerts', 'irrigationPlan', 'schemes', 'summary']
};

const buildContextMessage = (context) => {
  const { profile, weather, pest, news, disease } = context;
  const newsSummary = (news || []).slice(0, 5).map(n => ({
    title: n.title,
    category: n.category,
    url: n.url
  }));
  return JSON.stringify({
    profile,
    weather: {
      temperature: weather?.temperature,
      humidity: weather?.humidity,
      description: weather?.description,
      windSpeed: weather?.windSpeed
    },
    pest,
    news: newsSummary,
    disease: disease || null,
    timestampIso: new Date().toISOString()
  });
};

const adviceCacheKey = (context, mode) => {
  const { profile, weather, pest, disease } = context;
  const tempBucket = Math.round(weather?.temperature ?? 0);
  const humBucket = Math.round(weather?.humidity ?? 0);
  return [
    mode,
    String(profile?.city || '').toLowerCase(),
    String(profile?.crop || '').toLowerCase(),
    tempBucket,
    humBucket,
    String(weather?.description || '').toLowerCase(),
    pest?.riskLevel || '',
    pest?.newsAlertActive ? '1' : '0',
    disease?.disease || '',
  ].join('|');
};

const generateAdvice = async (context, mode = 'quick') => {
  if (!isEnabled()) throw new Error('OPENAI_API_KEY not configured');

  const key = adviceCacheKey(context, mode);
  return withCache('ai:advice', key, ADVICE_TTL_MS, async () => {
    const schema = mode === 'full' ? fullAdviceSchema : quickDecisionSchema;
    const schemaName = mode === 'full' ? 'full_advice' : 'quick_decision';
    const extras = mode === 'full'
      ? ' Also produce irrigationPlan.nextAction (concrete action), irrigationPlan.windowHours (integer hours until action), irrigationPlan.notes, schemes (2-4 items pulled from provided news with url), and a 3-5 sentence plain-text summary a farmer can read.'
      : '';
    const messages = [
      {
        role: 'system',
        content: `You are AgriSmart, an expert agronomy decision engine. Using the provided context (weather, rule-based pest risk score, optional image analysis, and local news), produce a structured recommendation for a farmer. Keep language simple and specific. confidence must be an integer percentage followed by %, e.g. "87%". actions must be concrete and locally relevant. status mapping: HIGH->CRITICAL, MEDIUM->WARNING, LOW->STABLE unless overridden by a specific event.${extras}`
      },
      { role: 'user', content: buildContextMessage(context) }
    ];
    return callJSON({ schemaName, schema, messages });
  });
};

module.exports = {
  MODEL,
  isEnabled,
  classifyNews,
  analyzeLeafImage,
  generateAdvice,
  AIError,
};
