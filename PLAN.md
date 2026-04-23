# AgriSmart — Final Architecture & Migration Plan

**Scope:** Rewire the existing AgriSmart codebase to be simple, cost-bounded, and dependable.
**Constraints (hard):**
- Use **OpenAI only** — drop Gemini entirely.
- Use **`gpt-4o-mini` exclusively** for every AI call (reasoning, news classification, decision synthesis, vision/leaf disease). No tiered-model setup.
- **No web search / browsing** inside the product. News signals come only from the existing NewsAPI keyword pipeline.
- Keep the current stack: Node.js + Express (backend), React + Vite (frontend), Axios, Multer.
- No new frameworks (no LangChain, no Agents SDK). Hand-rolled orchestration with the `openai` npm package.

---

## 1. Goals

1. **Replace Gemini with OpenAI** across the three places it is currently used:
   - `backend/services/diseaseService.js` (image → disease)
   - `backend/services/decisionEngine.js` (context → decision JSON)
   - `backend/routes/smartAdvice.js` (master synthesis markdown report)
2. **Collapse duplication.** Today there are two parallel AI synthesis paths (`decisionEngine` and `smartAdvice`) with near-identical prompts and overlapping shapes. Merge to one.
3. **Make the pipeline deterministic and explainable.**
   - Rule-based pest scoring runs first (cheap, transparent).
   - AI only narrates, enriches, and adapts recommendations.
   - Strict JSON Schema outputs everywhere — delete all `.replace('```json', '')` + `JSON.parse` hacks.
4. **Graceful degradation.** If `OPENAI_API_KEY` is missing, if a call fails, or if rate-limited → fall back to the deterministic generator. Never blank-screen.
5. **Location-aware by default.** Remove the hardcoded Pune profile. Profiles live in a JSON file; the autonomous loop iterates over them.
6. **Keep v1 simple.** No queues, no DB, no tool-calling agent loop. A plain `setInterval` + sequential fetch works fine for 2h cadence.

---

## 2. Current State — Files & Responsibilities

```
backend/
  server.js                         Express bootstrap + startAgent(120)
  data/rules.json                   Crop climate ranges (used by /recommend)
  routes/
    weather.js                      OpenWeather proxy
    recommend.js                    Static crop match against rules.json
    advice.js                       Gemini text advice (short)
    agent.js                        Manual agent run + logs
    disease.js                      Gemini vision (leaf image)
    pest.js                         Exposes pestService
    news.js                         Exposes newsService
    smartAdvice.js                  Gemini orchestrator (full markdown report)
  services/
    agentService.js                 Hardcoded AGENT_PROFILE (Pune/Cotton); 2h loop
    decisionEngine.js               Gemini decision JSON + deterministic fallback
    diseaseService.js               Gemini vision call
    pestService.js                  Rule-based risk score + news check
    newsService.js                  NewsAPI keyword classifier + mock fallbacks
    actionService.js                Console renderer for decisions
frontend/
  src/
    pages/ Dashboard, Alerts, Disease, News, PestAlerts, Profile, Schemes
    components/ Navbar, Card, DecisionCard, Loader, Input, Button, Badge
    layouts/ MainLayout, TopNavbar
```

**Pain points:**
- Two AI prompts with drifting contracts → frontend has to tolerate both shapes.
- All Gemini calls use manual markdown stripping + `JSON.parse` in a try/catch. Brittle.
- `agentService.js` hardcodes `{city: 'Pune', region: 'Maharashtra', crop: 'Cotton'}` and calls itself over HTTP (`axios.get('http://localhost:5000/...')`) rather than importing services. Fragile.
- `smartAdvice.js` inlines the Gemini client instead of using a service.
- No single source of truth for the "decision" schema the frontend consumes.

---

## 3. Target State — Files & Responsibilities

```
backend/
  server.js                         unchanged shape; updated route wiring
  data/
    rules.json                      unchanged
    profiles.json                   NEW — array of user/farm profiles
  routes/
    weather.js                      unchanged (OpenWeather)
    recommend.js                    unchanged (static crop rules)
    agent.js                        unchanged (manual run + logs)
    advice.js                       MERGED — handles quick/full/image via ?mode=
    news.js                         unchanged (exposes classified news)
    pest.js                         unchanged (exposes rule-based pest risk)
    disease.js                      unchanged endpoint; internally calls aiService
  services/
    aiService.js                    NEW — single OpenAI wrapper (3 functions)
    agentService.js                 reads profiles.json; calls services directly
    decisionEngine.js               keeps deterministic generator; delegates AI path to aiService
    pestService.js                  unchanged
    newsService.js                  unchanged (still keyword-based); optional AI re-rank via aiService
    actionService.js                unchanged
    diseaseService.js               DELETED — absorbed into aiService.analyzeLeafImage
```

**Routes collapse 8 → 7** (smartAdvice merges into advice).
**Services collapse 6 → 5** (diseaseService merges into aiService).
**Gemini dependency removed.**

---

## 4. The `aiService.js` Module (single source of AI truth)

One file. Three exports. All use `gpt-4o-mini` with **strict JSON Schema** response format. No markdown parsing anywhere else in the codebase.

### 4.1 `classifyNews(articles)`
- **Input:** array of `{title, description}` from NewsAPI.
- **Output schema (strict):**
  ```
  {
    items: [{
      title: string,
      category: "scheme" | "pest" | "weather" | "general",
      severity: "low" | "medium" | "high",
      extractedPest: string | null,
      relevance: number   // 0–100
    }]
  }
  ```
- **Use:** optional upgrade for `newsService.fetchAgriNews` — if `OPENAI_API_KEY` is set, replace the keyword heuristic with one batched AI call for all 10 articles. Otherwise keep the current keyword fallback.
- **Cost:** ~1 call per agent cycle (every 2h).

### 4.2 `analyzeLeafImage(buffer, mimeType)`
- **Input:** image buffer + mime.
- **Model call:** `openai.chat.completions.create` with `model: 'gpt-4o-mini'`, a vision content part (`image_url` with `data:<mime>;base64,<…>`), and strict JSON schema.
- **Output schema (strict):**
  ```
  {
    disease: string,
    confidence: number,          // 0–100
    severity: "low" | "medium" | "high",
    treatments: string[]         // 2–4 items
  }
  ```
- **Use:** called by `routes/disease.js` and by the `mode=image` branch of `routes/advice.js`.
- **Note:** `gpt-4o-mini` supports vision; we use it exclusively per project constraint.

### 4.3 `generateAdvice(context, mode)`
- **Input:** `context = { profile, weather, pest, news, disease? }`. `mode = 'quick' | 'full'`.
- **`mode=quick`** — returns the compact decision object (the shape `DecisionCard.jsx` already consumes):
  ```
  {
    status: "CRITICAL" | "WARNING" | "STABLE",
    location: string,
    crop: string,
    riskLevel: "HIGH" | "MEDIUM" | "LOW",
    detectedThreat: string,
    confidence: string,          // e.g. "87%"
    reasoning: string,
    actions: string[],
    alerts: string[],
    timestamp: string
  }
  ```
- **`mode=full`** — returns the same compact object PLUS structured sub-sections:
  ```
  {
    ...<quick shape>,
    irrigationPlan: { nextAction: string, windowHours: number, notes: string },
    schemes: [{ title: string, why: string, url: string }],
    summary: string              // 3–5 sentence plain-text farmer-facing summary
  }
  ```
  No markdown field. If the frontend wants a rendered report, it composes it from the structured sub-sections. This eliminates the current problem where `actionableAdvice` is free-form markdown the frontend cannot reason about.
- **Fallback:** if OpenAI call throws, delegate to `decisionEngine.generateDeterministicDecision(context)` which already returns the `quick` shape. `mode=full` falls back to `quick` + empty `irrigationPlan/schemes/summary`.

### 4.4 Shared helpers inside `aiService.js`
- `buildClient()` — reads `OPENAI_API_KEY`, throws once at startup if missing, caches the client.
- `callJSON(schema, messages)` — wraps `chat.completions.create` with `response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } }`, returns parsed object (no regex, no try-to-parse dance).
- `MODEL = 'gpt-4o-mini'` — single constant; project constraint.

---

## 5. The Core Pipeline (the emoji list → code)

| Step                           | Implementation                                                                                                                         |
|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| 📍 Detects location            | Frontend asks for geolocation permission on Dashboard mount → sends `lat/lon` to `/api/advice?mode=quick`. Server-side: `agentService` reads `data/profiles.json`. |
| 🌤️ Fetches weather             | `routes/weather.js` unchanged (OpenWeather). `agentService` calls `weatherController.fetch(lat, lon)` directly instead of via HTTP.    |
| 📰 Analyzes news & signals     | `newsService.fetchAgriNews(city)` (keyword). If `OPENAI_API_KEY` set, pipes results through `aiService.classifyNews` for better categories/severity. |
| 🧠 Pest/disease risk           | `pestService.detectPestOutbreak(temp, humidity, crop, city)` (rule-based score + news check). Image → `aiService.analyzeLeafImage`.    |
| ⚙️ Context-based decisions     | `aiService.generateAdvice(ctx, mode)` — one call, strict schema, fallback to deterministic generator.                                  |
| 🚨 Alerts & recommendations    | `actionService.executeActions(decisions)` — today logs to console + pushes into `decisionMemory`. Frontend polls `/api/agent/logs`.    |
| 🔁 Loop                        | `startAgent(120)` — unchanged. Every 2h, iterates `profiles.json` and runs the pipeline per profile. Cooldown guard stays.             |

---

## 6. Migration — File-by-File Changes

### 6.1 `backend/package.json`
- **Remove:** `@google/generative-ai`.
- **Keep:** `openai` (already present), `axios`, `cors`, `dotenv`, `express`, `multer`.
- Run `npm install` after edit.

### 6.2 `backend/.env`
- **Remove:** `GEMINI_API_KEY`.
- **Keep:** `OPENWEATHER_API_KEY`, `NEWS_API_KEY`, `PORT`.
- **Add:** `OPENAI_API_KEY`.

### 6.3 `backend/services/aiService.js` (NEW)
- Implements §4 above. Single `MODEL = 'gpt-4o-mini'` constant.
- Exports `classifyNews`, `analyzeLeafImage`, `generateAdvice`.

### 6.4 `backend/services/diseaseService.js` (DELETE)
- Absorbed into `aiService.analyzeLeafImage`.
- Update `routes/disease.js` import to `aiService`.

### 6.5 `backend/services/decisionEngine.js`
- Remove `GoogleGenerativeAI` import and `generateAIDecisions`.
- `generateDecisions(context)` becomes:
  1. Try `aiService.generateAdvice(context, 'quick')`.
  2. On throw or missing key → `generateDeterministicDecision(context)`.
  3. Push to `decisionMemory`, cap at 20.
- Keep `generateDeterministicDecision` untouched — it's the fallback.
- Keep `ACTION_LIBRARY`, `calculateConfidence`, `generateReasoning` untouched.

### 6.6 `backend/routes/smartAdvice.js` (DELETE)
- Behaviour moves to `routes/advice.js` under `?mode=full`.
- Remove from `server.js` route registration.

### 6.7 `backend/routes/advice.js` (REWRITE)
- Accept `GET` for `mode=quick` (query params: `lat`, `lon` OR `city`, `crop`).
- Accept `POST` (multipart) for `mode=full` and `mode=image` (optional `image` file + `city` + `crop`).
- Flow:
  1. Resolve weather (reuse `routes/weather.js` handler logic via an exported controller fn, or call `axios` against itself as today — preferred: extract `fetchWeather(params)` into `services/weatherService.js` later; not required for v1, but note as cleanup).
  2. Compute `pestService.detectPestOutbreak(...)`.
  3. Fetch `newsService.fetchAgriNews(city)`.
  4. If image present → `aiService.analyzeLeafImage(file.buffer, file.mimetype)`.
  5. Build `context = { profile, weather, pest, news, disease? }`.
  6. Call `aiService.generateAdvice(context, mode)`.
  7. Respond `{ status: 'success', data: <advice object> }`.

### 6.8 `backend/services/agentService.js`
- Replace hardcoded `AGENT_PROFILE` with `const profiles = require('../data/profiles.json')`.
- Replace `axios.get('http://localhost:5000/api/weather...')` with a direct call to a weather service helper. If you don't extract one now, at minimum use `process.env.PORT` and keep HTTP; flag as follow-up.
- Loop: `for (const profile of profiles) { await runOne(profile) }` with the existing cooldown guard moved to per-profile.
- Call `decisionEngine.generateDecisions(context)` which now internally uses `aiService`.

### 6.9 `backend/data/profiles.json` (NEW)
- Array of:
  ```
  { id: string, city: string, region: string, lat: string, lon: string, crop: string }
  ```
- Seed with the current Pune/Cotton entry so behaviour is unchanged on day 1.

### 6.10 `backend/routes/disease.js`
- Swap `require('../services/diseaseService')` → `require('../services/aiService')`.
- Call `aiService.analyzeLeafImage(buffer, mimetype)` instead of `analyzeImage(...)`.

### 6.11 Frontend
- **No breaking shape changes** — `generateAdvice(..., 'quick')` returns exactly what `DecisionCard.jsx` already renders.
- `mode=full` response: add a small section in the Smart Advice page to render `irrigationPlan`, `schemes`, `summary` as plain components (no markdown parser needed).
- `Dashboard.jsx`: add `navigator.geolocation.getCurrentPosition` on mount; pass `lat/lon` to `/api/advice?mode=quick`.
- `Profile.jsx`: add UI to `POST /api/profiles` (stretch — not required v1; for now edit `profiles.json` by hand).

---

## 7. Removed / Deferred

**Removed (from the Gemini-era design):**
- All markdown-stripping JSON parsing.
- Dual synthesis paths (`decisionEngine` AI path + `smartAdvice` prompt).
- Hardcoded farmer profile.
- `@google/generative-ai` dependency.

**Deferred (NOT in v1):**
- OpenAI tool-calling / function-calling agent loop. We do the 4-step orchestration by hand; v1 doesn't need the model to choose tools.
- Queues (BullMQ / Redis). `setInterval` is fine at 2h cadence for a handful of profiles.
- Database. `profiles.json` + in-memory `decisionMemory` (capped at 20) is fine for v1.
- WhatsApp / SMS dispatch hooks. `actionService` stays console + in-memory.
- Web search / browsing enrichment. Explicitly out of scope per project constraint.
- Model tiering (`gpt-4o`, `o3`, etc.). Explicitly out of scope per project constraint — `gpt-4o-mini` for everything.
- Auto-translating advice to regional languages.

---

## 8. Cost & Performance Envelope

- **Per agent cycle:** at most 2 OpenAI calls — one `classifyNews` (optional, skippable if key missing), one `generateAdvice`.
- **Per farmer per day:** ~12 cycles × 2 calls = 24 calls.
- **Per image upload:** 1 vision call on demand.
- All calls are `gpt-4o-mini`, which is the cheapest multimodal-capable tier. Cost is negligible for demo/v1 volumes.
- Latency: ~2–4 s per advice call; fine for a 2-hour loop and acceptable for on-demand `/advice` requests.

---

## 9. Failure Modes & Handling

| Failure                         | Behavior                                                                                           |
|---------------------------------|----------------------------------------------------------------------------------------------------|
| `OPENAI_API_KEY` missing        | `aiService` no-ops. `decisionEngine` uses deterministic generator. `newsService` uses keyword path. `disease` route returns 500 with clear message. |
| OpenAI call throws              | `aiService` functions catch and rethrow a tagged error. Callers fall back to deterministic path. |
| OpenWeather down                | `routes/weather.js` returns 500. Agent cycle logs error and skips that profile; other profiles proceed. |
| NewsAPI down or no key          | `newsService` returns `mockAgriNews()` (already implemented).                                      |
| Schema validation fails         | Strict mode should prevent this. If it ever happens, treat as a thrown error → deterministic fallback. |
| Image too large                 | Multer 5 MB limit + clear error message (already in place).                                        |

---

## 10. Implementation Sequence (when you say "code it")

1. **Add `aiService.js`** with the three functions and strict JSON schemas. Wire `OPENAI_API_KEY` handling. Manual smoke test via a one-off script.
2. **Swap disease path** — rewrite `routes/disease.js` to use `aiService.analyzeLeafImage`; delete `services/diseaseService.js`. Test with a leaf image.
3. **Rewire `decisionEngine.generateDecisions`** to delegate to `aiService.generateAdvice(ctx, 'quick')` with deterministic fallback. Verify agent log shape unchanged.
4. **Merge `smartAdvice` into `advice`** — add `?mode=full`, delete `routes/smartAdvice.js`, unregister in `server.js`. Verify the Smart Advice page still works end-to-end with the new structured shape (update the page once to stop parsing markdown).
5. **Profiles file** — create `data/profiles.json`, update `agentService.js` to loop. Keep the Pune/Cotton seed.
6. **Remove `@google/generative-ai`** dep, run `npm install`, smoke test the full `POST /api/agent/run` cycle and every route.
7. **Frontend location prompt** on `Dashboard.jsx` (small change).

Total diff estimate: **+1 file, -2 files, ~6 files edited**, no frontend shape break.

---

## 11. Acceptance Checklist

- [ ] `grep -r "google/generative-ai" backend/` returns nothing.
- [ ] `grep -r "GEMINI_API_KEY" backend/` returns nothing.
- [ ] Only `gpt-4o-mini` appears as a model string anywhere in the codebase.
- [ ] `/api/advice?mode=quick` returns the DecisionCard shape.
- [ ] `/api/advice?mode=full` returns quick shape + `irrigationPlan` + `schemes` + `summary`.
- [ ] `/api/disease-detect` returns `{disease, confidence, severity, treatments}`.
- [ ] With `OPENAI_API_KEY` unset, `/api/advice?mode=quick` still returns a valid decision (deterministic fallback).
- [ ] `POST /api/agent/run` completes end-to-end with no uncaught errors for every profile in `profiles.json`.
- [ ] Frontend `DecisionCard.jsx` renders without code changes.
