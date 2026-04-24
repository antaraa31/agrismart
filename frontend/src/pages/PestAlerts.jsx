import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Bug, Newspaper, MapPin } from 'lucide-react';
import { Page, Hero, Section, Card, Tag, Row, Button, Empty } from '../components/ui';
import Loader from '../components/Loader';

const toneForRisk = (level) => (level === 'HIGH' ? 'danger' : level === 'MEDIUM' ? 'warn' : 'good');
const iconForRisk = (level) => (level === 'LOW' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />);

const readProfile = () => {
  try {
    const s = localStorage.getItem('agriProfile');
    if (s) {
      const p = JSON.parse(s);
      if (p && p.city && p.crop) return p;
    }
  } catch {}
  return null;
};

const PestAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [weather, setWeather] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const p = readProfile();
    if (!p) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(p);

    const run = async () => {
      try {
        setLoading(true);
        const wRes = await fetch(`http://localhost:5000/api/weather?city=${encodeURIComponent(p.city)}`);
        const w = await wRes.json();
        if (wRes.ok) setWeather(w.data);

        if (wRes.ok) {
          const pRes = await fetch('http://localhost:5000/api/pest-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temperature: w.data.temperature, humidity: w.data.humidity, crop: p.crop }),
          });
          if (pRes.ok) {
            const pData = await pRes.json();
            setAlert(pData.data);
          }
        }
      } catch (err) {
        console.error('Pest error:', err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (!loading && !profile) {
    return (
      <Page>
        <Hero eyebrow="Pest intelligence" title="Eyes on the field." subtitle="Set up your farm profile so we can watch for threats in your region." />
        <Card className="!p-12">
          <Empty title="No profile yet" hint="Head to Profile to add your location and crop." />
          <div className="mt-6 text-center">
            <Button as="a" href="/profile">Set up profile</Button>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Hero
        eyebrow="Pest intelligence"
        title="Eyes on the field."
        subtitle="We watch weather signals and local reports so you can act before anything spreads."
      >
        <div className="flex items-center gap-3 flex-wrap">
          {alert && <Tag tone={toneForRisk(alert.riskLevel)} dot>{alert.riskLevel} RISK</Tag>}
          {profile?.city && (
            <span className="type-small inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-[var(--color-ink-subtle)]" />
              {profile.city}
            </span>
          )}
        </div>
      </Hero>

      <Section>
        {loading ? (
          <Loader type="card" />
        ) : alert ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="!p-10 lg:col-span-2 fade-in">
              <div className="flex items-start justify-between mb-7">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)]">
                    {iconForRisk(alert.riskLevel)}
                  </span>
                  <span className="type-eyebrow !text-[var(--color-ink-muted)]">Active threat</span>
                </div>
                <span className="type-caption tabular-nums">Score · {alert.score}/100</span>
              </div>

              <h2 className="type-h1 mb-3 flex items-center gap-3">
                <Bug size={26} className="text-[var(--color-ink-muted)]" />
                {alert.likelyPest}
              </h2>
              <p className="type-body-muted max-w-[58ch] mb-8">
                {alert.newsAlertActive
                  ? 'Corroborated by active local reports in your region.'
                  : 'Inferred from current environmental conditions.'}
              </p>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[var(--color-hairline)]">
                <div>
                  <div className="type-caption mb-1.5">Risk level</div>
                  <div className="type-h2">{alert.riskLevel}</div>
                </div>
                <div>
                  <div className="type-caption mb-1.5">Crop</div>
                  <div className="type-h2">{profile.crop}</div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="!p-6">
                <div className="type-eyebrow !text-[var(--color-ink-muted)] mb-4">Signals</div>
                <Row label="Temperature" value={weather ? `${Math.round(weather.temperature)}°C` : '—'} mono />
                <Row label="Humidity" value={weather ? `${weather.humidity}%` : '—'} mono />
                <Row label="Conditions" value={weather?.description ?? '—'} />
                <Row label="News alert" value={alert.newsAlertActive ? 'Active' : 'None'} />
              </Card>

              <Card className="!p-6">
                <div className="type-eyebrow !text-[var(--color-ink-muted)] mb-3 flex items-center gap-2">
                  <Newspaper size={12} /> Next step
                </div>
                <p className="type-body mb-5">
                  Open the dashboard for the full AI recommendation — including actions you can take today.
                </p>
                <Button as="a" href="/" variant="secondary" className="!py-2 !px-4 !text-[13px]">See recommendation</Button>
              </Card>
            </div>
          </div>
        ) : (
          <Card><Empty icon={<ShieldCheck size={18} />} title="All quiet" hint="No pest alerts for your region right now." /></Card>
        )}
      </Section>
    </Page>
  );
};

export default PestAlerts;
