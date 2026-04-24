const express = require('express');
const fs = require('fs');
const path = require('path');
const { invalidateAll } = require('../services/cache');

const router = express.Router();
const profilesPath = path.join(__dirname, '../data/profiles.json');

const readProfiles = () => {
  try {
    return JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
  } catch {
    return [];
  }
};

const writeProfiles = (arr) => {
  fs.writeFileSync(profilesPath, JSON.stringify(arr, null, 2) + '\n', 'utf-8');
};

// GET /api/profile  -> returns the default (first) profile
router.get('/', (req, res) => {
  const profiles = readProfiles();
  const p = profiles[0] || null;
  res.status(200).json({ status: 'success', data: p });
});

// PUT /api/profile  -> replaces the default profile (id="default")
// body: { city, region?, lat?, lon?, crop }
router.put('/', (req, res) => {
  const { city, region = '', lat = '', lon = '', crop } = req.body || {};
  if (!city || !crop) {
    return res.status(400).json({ status: 'error', message: 'city and crop are required' });
  }
  const profiles = readProfiles();
  const next = {
    id: 'default',
    city: String(city).trim(),
    region: String(region).trim(),
    lat: lat ? String(lat) : '',
    lon: lon ? String(lon) : '',
    crop: String(crop).trim(),
  };
  const idx = profiles.findIndex((p) => p.id === 'default');
  if (idx >= 0) profiles[idx] = next;
  else profiles.unshift(next);
  writeProfiles(profiles);
  // Profile change invalidates every cached upstream result so the next read is fresh.
  const cleared = invalidateAll();
  if (cleared > 0) console.log(`[cache] CLEARED ${cleared} entries after profile write`);
  res.status(200).json({ status: 'success', data: next });
});

module.exports = router;
