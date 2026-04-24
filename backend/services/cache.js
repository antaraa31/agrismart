/**
 * Production-style in-memory cache with TTL, in-flight deduplication, and per-store invalidation.
 *
 * - Multiple concurrent calls for the same key share one upstream request (thundering-herd protection).
 * - Failures are not cached; the next call retries.
 * - `invalidate(store, key?)` lets write paths blow away stale reads (e.g. profile update).
 *
 * Single-process only. If this ever becomes a multi-instance deployment, swap the Map for Redis —
 * the withCache signature stays the same.
 */

const stores = new Map();
const inflight = new Map(); // `${store}::${key}` -> Promise

const now = () => Date.now();

const getStore = (name) => {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name);
};

const flightKey = (store, key) => `${store}::${key}`;

const withCache = async (store, key, ttlMs, compute) => {
  const s = getStore(store);
  const cached = s.get(key);
  if (cached && cached.expiresAt > now()) {
    console.log(`[cache] HIT  ${store} "${key}" (${Math.round((cached.expiresAt - now()) / 1000)}s left)`);
    return cached.value;
  }

  const fk = flightKey(store, key);
  const existing = inflight.get(fk);
  if (existing) {
    console.log(`[cache] WAIT ${store} "${key}" (coalescing)`);
    return existing;
  }

  console.log(`[cache] MISS ${store} "${key}"`);
  const promise = (async () => {
    try {
      const value = await compute();
      s.set(key, { value, expiresAt: now() + ttlMs });
      return value;
    } finally {
      inflight.delete(fk);
    }
  })();
  inflight.set(fk, promise);
  return promise;
};

const invalidate = (store, key) => {
  const s = stores.get(store);
  if (!s) return 0;
  if (key === undefined) {
    const n = s.size;
    s.clear();
    return n;
  }
  return s.delete(key) ? 1 : 0;
};

const invalidateAll = () => {
  let n = 0;
  for (const s of stores.values()) {
    n += s.size;
    s.clear();
  }
  return n;
};

const stats = () => {
  const out = {};
  for (const [name, s] of stores.entries()) {
    out[name] = { size: s.size };
  }
  return out;
};

module.exports = { withCache, invalidate, invalidateAll, stats };
