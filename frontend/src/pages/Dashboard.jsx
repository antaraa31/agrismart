import React, { useEffect, useState } from 'react';
import { MapPin, Wind, Droplets, Thermometer, Cloud, Sparkles, Check, RefreshCw, Locate } from 'lucide-react';
import { Page, Hero, Section, Card, Stat, Tag, Button } from '../components/ui';
import Loader from '../components/Loader';

const toneForStatus = (status) => {
  if (status === 'CRITICAL') return 'danger';
  if (status === 'WARNING') return 'warn';
  return 'good';
};

const readProfile = () => {
  try {
    const s = localStorage.getItem('agriProfile');
    if (s) return JSON.parse(s);
  } catch {}
  return { city: 'Pune', crop: 'Cotton' };
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [decision, setDecision] = useState(null);
  const [location, setLocation] = useState('');
  const [profile, setProfile] = useState({ city: 'Pune', crop: 'Cotton' });

  const fetchAdvice = async (params) => {
    const url = `http://localhost:5000/api/advice?${params}&mode=quick`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`advice request failed (${res.status})`);
    return (await res.json()).data;
  };

  const loadForProfile = async (p) => {
    setLoading(true);
    try {
      const d = await fetchAdvice(`city=${encodeURIComponent(p.city)}&crop=${encodeURIComponent(p.crop || 'Cotton')}`);
      setWeather(d.weather);
      setDecision(d.decision);
      setLocation(d.weather?.city || p.city);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const d = await fetchAdvice(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&crop=${encodeURIComponent(profile.crop || 'Cotton')}`);
          setWeather(d.weather);
          setDecision(d.decision);
          setLocation(d.weather?.city || 'Here');
        } catch (err) {
          console.error('geo advice failed:', err);
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false),
      { timeout: 5000 }
    );
  };

  const load = async () => {
    const p = readProfile();
    setProfile(p);
    setLocation(p.city);
    await loadForProfile(p);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <Page>
      <Hero
        eyebrow="Today in your field"
        title={location ? `Good farming, ${location}.` : 'Good farming.'}
        subtitle={profile.crop ? `Intelligence for your ${profile.crop.toLowerCase()} crop, refreshed in real time.` : 'Your AI agronomist, refreshed in real time.'}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {decision && <Tag tone={toneForStatus(decision.status)} dot>{decision.status}</Tag>}
          {weather && (
            <span className="type-small inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-[var(--color-ink-subtle)]" />
              {location}
            </span>
          )}
          <button onClick={load} className="btn-link type-small" aria-label="Refresh">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={useMyLocation} className="btn-link type-small" aria-label="Use my location">
            <Locate size={14} /> Use my location
          </button>
        </div>
      </Hero>

      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading || !weather ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="!p-6"><div className="h-4 w-20 skel mb-3" /><div className="h-8 w-16 skel" /></Card>
            ))
          ) : (
            <>
              <Card className="!p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="type-caption">Temperature</span>
                  <Thermometer size={16} className="text-[var(--color-ink-subtle)]" />
                </div>
                <Stat value={Math.round(weather.temperature)} unit="°C" />
              </Card>
              <Card className="!p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="type-caption">Humidity</span>
                  <Droplets size={16} className="text-[var(--color-ink-subtle)]" />
                </div>
                <Stat value={Math.round(weather.humidity)} unit="%" />
              </Card>
              <Card className="!p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="type-caption">Wind</span>
                  <Wind size={16} className="text-[var(--color-ink-subtle)]" />
                </div>
                <Stat value={weather.windSpeed?.toFixed(1)} unit="m/s" />
              </Card>
              <Card className="!p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="type-caption">Conditions</span>
                  <Cloud size={16} className="text-[var(--color-ink-subtle)]" />
                </div>
                <div className="type-h3 capitalize">{weather.description}</div>
              </Card>
            </>
          )}
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <Loader type="card" />
            ) : decision ? (
              <Card className="!p-10 fade-in">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                      <Sparkles size={14} />
                    </span>
                    <span className="type-eyebrow !text-[var(--color-ink-muted)]">AI Recommendation</span>
                  </div>
                  <Tag tone={toneForStatus(decision.status)}>{decision.riskLevel} RISK</Tag>
                </div>

                <h2 className="type-h1 mb-4">{decision.detectedThreat}</h2>
                <p className="type-body-muted mb-8 max-w-[58ch]">{decision.reasoning}</p>

                <div className="grid grid-cols-2 gap-6 mb-10 pb-8 border-b border-[var(--color-hairline)]">
                  <div>
                    <div className="type-caption mb-1.5">Confidence</div>
                    <div className="type-h2 tabular-nums">{decision.confidence}</div>
                  </div>
                  <div>
                    <div className="type-caption mb-1.5">Crop</div>
                    <div className="type-h2">{decision.crop}</div>
                  </div>
                </div>

                <div>
                  <h3 className="type-h3 mb-5">Recommended actions</h3>
                  <ul className="space-y-4">
                    {(decision.actions || []).map((a, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-[3px] inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span className="type-body leading-snug">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ) : (
              <Card><div className="type-body-muted">Unable to fetch recommendation.</div></Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="!p-6">
              <div className="type-eyebrow !text-[var(--color-ink-muted)] mb-4">Alerts</div>
              {decision?.alerts?.length ? (
                <ul className="space-y-3">
                  {decision.alerts.map((a, i) => (
                    <li key={i} className="flex items-start gap-2.5 type-small !text-[var(--color-ink)]">
                      <span className="w-1 h-1 rounded-full bg-[var(--color-ink-muted)] mt-[9px] shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="type-small">No active alerts.</div>
              )}
            </Card>

            <Card className="!p-6">
              <div className="type-eyebrow !text-[var(--color-ink-muted)] mb-4">Location</div>
              <div className="type-h3 mb-1">{location || '—'}</div>
              <div className="type-small">
                {weather ? `${Math.round(weather.temperature)}° · ${weather.description}` : '—'}
              </div>
              <div className="mt-5">
                <Button as="a" href="/profile" variant="secondary" className="!py-2 !px-4 !text-[13px]">Edit profile</Button>
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </Page>
  );
};

export default Dashboard;
