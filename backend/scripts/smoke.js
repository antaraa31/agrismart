/*
 * End-to-end smoke tests for the AgriSmart backend.
 * Assumes the server is already running on PORT (default 5000).
 * Validates response shapes, status codes, and exercises the fallback paths.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}/api`;

let passed = 0;
let failed = 0;
const failures = [];

const ok = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`  \u2713 ${name}`); }
  else { failed++; failures.push({ name, detail }); console.log(`  \u2717 ${name}${detail ? ' — ' + detail : ''}`); }
};

const section = (title) => console.log(`\n=== ${title} ===`);

const hasKey = (obj, key) => obj && Object.prototype.hasOwnProperty.call(obj, key);

const isDecisionShape = (d) =>
  d && typeof d === 'object'
  && hasKey(d, 'status') && hasKey(d, 'riskLevel') && hasKey(d, 'detectedThreat')
  && hasKey(d, 'confidence') && hasKey(d, 'reasoning')
  && Array.isArray(d.actions) && Array.isArray(d.alerts);

const isFullShape = (d) =>
  isDecisionShape(d)
  && d.irrigationPlan && typeof d.irrigationPlan.nextAction === 'string'
  && typeof d.irrigationPlan.windowHours === 'number'
  && Array.isArray(d.schemes) && typeof d.summary === 'string';

const run = async () => {
  console.log(`Target: ${BASE}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'set' : 'MISSING (fallback paths will be exercised)'}`);
  console.log(`OPENWEATHER_API_KEY: ${process.env.OPENWEATHER_API_KEY ? 'set' : 'MISSING'}`);
  console.log(`NEWS_API_KEY: ${process.env.NEWS_API_KEY ? 'set' : 'MISSING (mock news will be used)'}`);

  // -------- Health --------
  section('Health');
  try {
    const r = await axios.get(`${BASE}/health`);
    ok('GET /api/health 200', r.status === 200);
    ok('health status=success', r.data.status === 'success');
  } catch (e) {
    ok('GET /api/health 200', false, e.message);
    console.log('Aborting — server not reachable.');
    process.exit(1);
  }

  // -------- Weather --------
  section('Weather');
  try {
    const r = await axios.get(`${BASE}/weather?city=Pune`);
    ok('GET /api/weather?city=Pune 200', r.status === 200);
    ok('weather payload has temperature', typeof r.data?.data?.temperature === 'number');
    ok('weather payload has humidity', typeof r.data?.data?.humidity === 'number');
  } catch (e) {
    ok('GET /api/weather?city=Pune', false, e.response?.data?.message || e.message);
  }

  try {
    const r = await axios.get(`${BASE}/weather?lat=18.5204&lon=73.8567`);
    ok('GET /api/weather?lat/lon 200', r.status === 200);
  } catch (e) {
    ok('GET /api/weather?lat/lon', false, e.response?.data?.message || e.message);
  }

  try {
    await axios.get(`${BASE}/weather`);
    ok('GET /api/weather missing params -> 400', false, 'expected 400, got 200');
  } catch (e) {
    ok('GET /api/weather missing params -> 400', e.response?.status === 400);
  }

  // -------- Recommend --------
  section('Recommend');
  try {
    const r = await axios.get(`${BASE}/recommend?temperature=30&humidity=55`);
    ok('GET /api/recommend 200', r.status === 200);
    ok('recommend returns array', Array.isArray(r.data.data));
    ok('Cotton recommended at 30C/55%', r.data.data.some(c => c.crop === 'Cotton'));
  } catch (e) {
    ok('GET /api/recommend', false, e.message);
  }

  try {
    await axios.get(`${BASE}/recommend?temperature=30`);
    ok('GET /api/recommend missing humidity -> 400', false);
  } catch (e) {
    ok('GET /api/recommend missing humidity -> 400', e.response?.status === 400);
  }

  // -------- Pest alert --------
  section('Pest alert');
  try {
    const r = await axios.post(`${BASE}/pest-alert`, { temperature: 32, humidity: 80, crop: 'Cotton' });
    ok('POST /api/pest-alert 200', r.status === 200);
    const d = r.data.data;
    ok('pest returns riskLevel', typeof d.riskLevel === 'string');
    ok('pest returns likelyPest', typeof d.likelyPest === 'string');
    ok('pest score 0-100', d.score >= 0 && d.score <= 100);
  } catch (e) {
    ok('POST /api/pest-alert', false, e.message);
  }

  try {
    await axios.post(`${BASE}/pest-alert`, { temperature: 32 });
    ok('POST /api/pest-alert missing fields -> 400', false);
  } catch (e) {
    ok('POST /api/pest-alert missing fields -> 400', e.response?.status === 400);
  }

  // -------- News --------
  section('News');
  try {
    const r = await axios.get(`${BASE}/agri-news`);
    ok('GET /api/agri-news 200', r.status === 200);
    ok('news returns array', Array.isArray(r.data.data));
    if (r.data.data.length > 0) {
      const n = r.data.data[0];
      ok('news item has title', typeof n.title === 'string');
      ok('news item has category', typeof n.category === 'string');
    }
  } catch (e) {
    ok('GET /api/agri-news', false, e.message);
  }

  // -------- Advice GET (quick) --------
  section('Advice GET (quick)');
  try {
    const r = await axios.get(`${BASE}/advice?city=Pune&crop=Cotton&mode=quick`);
    ok('GET /api/advice?mode=quick 200', r.status === 200);
    ok('quick decision has DecisionCard shape', isDecisionShape(r.data.data.decision));
    ok('quick decision crop=Cotton', r.data.data.decision.crop === 'Cotton');
    ok('quick response includes weather', typeof r.data.data.weather?.temperature === 'number');
    ok('quick response includes pest', typeof r.data.data.pest?.riskLevel === 'string');
    ok('quick actions is non-empty array', r.data.data.decision.actions.length >= 2);
    console.log('     threat:', r.data.data.decision.detectedThreat);
    console.log('     confidence:', r.data.data.decision.confidence);
  } catch (e) {
    ok('GET /api/advice?mode=quick', false, e.response?.data?.message || e.message);
  }

  try {
    await axios.get(`${BASE}/advice?crop=Cotton`);
    ok('GET /api/advice missing location -> 400', false);
  } catch (e) {
    ok('GET /api/advice missing location -> 400', e.response?.status === 400);
  }

  // -------- Advice POST (full, no image) --------
  section('Advice POST (full, no image)');
  try {
    const form = new FormData();
    form.append('city', 'Pune');
    form.append('crop', 'Cotton');
    form.append('mode', 'full');
    const r = await axios.post(`${BASE}/advice`, form, { headers: form.getHeaders() });
    ok('POST /api/advice 200', r.status === 200);
    ok('full decision has extended shape', isFullShape(r.data.data.decision));
    ok('rawIntelligence includes weather', !!r.data.data.rawIntelligence?.weather);
    ok('rawIntelligence.disease is null (no image)', r.data.data.rawIntelligence?.disease === null);
    console.log('     summary:', r.data.data.decision.summary?.slice(0, 140));
  } catch (e) {
    ok('POST /api/advice (full)', false, e.response?.data?.message || e.message);
  }

  // Back-compat: /api/smart-advice alias
  try {
    const form = new FormData();
    form.append('city', 'Pune');
    form.append('crop', 'Cotton');
    const r = await axios.post(`${BASE}/smart-advice`, form, { headers: form.getHeaders() });
    ok('POST /api/smart-advice (alias) 200', r.status === 200);
    ok('alias returns decision', isDecisionShape(r.data.data.decision));
  } catch (e) {
    ok('POST /api/smart-advice (alias)', false, e.response?.data?.message || e.message);
  }

  // -------- Advice POST (image) --------
  section('Advice POST (full + image)');
  const imagePath = path.join(__dirname, 'test-leaf.jpg');
  if (!fs.existsSync(imagePath)) {
    console.log('  (skipping image test — scripts/test-leaf.jpg not present)');
  } else {
    try {
      const form = new FormData();
      form.append('city', 'Pune');
      form.append('crop', 'Cotton');
      form.append('mode', 'full');
      form.append('image', fs.createReadStream(imagePath), { filename: 'leaf.jpg', contentType: 'image/jpeg' });
      const r = await axios.post(`${BASE}/advice`, form, { headers: form.getHeaders() });
      ok('POST /api/advice (with image) 200', r.status === 200);
      if (process.env.OPENAI_API_KEY) {
        const d = r.data.data.rawIntelligence?.disease;
        ok('disease payload present when AI enabled', !!d);
        if (d && !d.error) {
          ok('disease.disease string', typeof d.disease === 'string');
          ok('disease.confidence number', typeof d.confidence === 'number');
          ok('disease.treatments array', Array.isArray(d.treatments));
          console.log('     disease:', d.disease, d.confidence + '%');
        }
      }
    } catch (e) {
      ok('POST /api/advice (with image)', false, e.response?.data?.message || e.message);
    }
  }

  // -------- Disease route direct --------
  section('Disease route (direct)');
  if (fs.existsSync(imagePath) && process.env.OPENAI_API_KEY) {
    try {
      const form = new FormData();
      form.append('image', fs.createReadStream(imagePath), { filename: 'leaf.jpg', contentType: 'image/jpeg' });
      const r = await axios.post(`${BASE}/disease-detect`, form, { headers: form.getHeaders() });
      ok('POST /api/disease-detect 200', r.status === 200);
      const d = r.data.data;
      ok('disease shape {disease,confidence,severity,treatments}',
        typeof d.disease === 'string'
        && typeof d.confidence === 'number'
        && ['low','medium','high'].includes(d.severity)
        && Array.isArray(d.treatments));
    } catch (e) {
      ok('POST /api/disease-detect', false, e.response?.data?.message || e.message);
    }
  } else {
    console.log('  (skipping — no OPENAI_API_KEY or test image)');
  }

  try {
    const r = await axios.post(`${BASE}/disease-detect`, {});
    ok('POST /api/disease-detect no file -> 400', r.status === 400);
  } catch (e) {
    ok('POST /api/disease-detect no file -> 400', e.response?.status === 400);
  }

  // -------- Agent --------
  section('Agent');
  try {
    const r = await axios.post(`${BASE}/agent/run`, {}, { timeout: 60000 });
    ok('POST /api/agent/run 200', r.status === 200);
  } catch (e) {
    ok('POST /api/agent/run', false, e.response?.data?.message || e.message);
  }

  try {
    const r = await axios.get(`${BASE}/agent/logs`);
    ok('GET /api/agent/logs 200', r.status === 200);
    ok('agent logs returns array', Array.isArray(r.data.data));
    ok('agent logs non-empty after run', r.data.data.length >= 1);
    if (r.data.data.length) {
      const last = r.data.data[r.data.data.length - 1];
      ok('last log has DecisionCard shape', isDecisionShape(last));
    }
  } catch (e) {
    ok('GET /api/agent/logs', false, e.message);
  }

  // -------- Summary --------
  console.log(`\n===================================`);
  console.log(`Passed: ${passed}   Failed: ${failed}`);
  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(` - ${f.name}${f.detail ? ': ' + f.detail : ''}`));
    process.exit(1);
  }
  process.exit(0);
};

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
