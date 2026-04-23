import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Page, Hero, Section, Card, Button, Divider } from '../components/ui';

const crops = ['Wheat', 'Corn', 'Cotton', 'Soybeans', 'Rice'];

const Field = ({ label, hint, children }) => (
  <div className="py-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-10">
    <div className="md:w-48 shrink-0">
      <div className="type-body font-medium">{label}</div>
      {hint && <div className="type-caption mt-0.5">{hint}</div>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', location: '', crop: 'Cotton', size: '', bio: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('agriProfile');
    if (s) {
      const p = JSON.parse(s);
      setProfile({
        name: p.name || '',
        location: p.city || '',
        crop: p.crop || 'Cotton',
        size: p.size || '',
        bio: p.bio || '',
      });
    }
  }, []);

  const handle = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    localStorage.setItem(
      'agriProfile',
      JSON.stringify({ name: profile.name, city: profile.location, crop: profile.crop, size: profile.size, bio: profile.bio })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <Page>
      <Hero
        eyebrow="Profile"
        title="Your field, your way."
        subtitle="Tell us about your farm so recommendations are tailored to the ground you actually work."
      />

      <Section>
        <form onSubmit={save}>
          <Card className="!p-0 overflow-hidden">
            <div className="px-8 py-6 border-b border-[var(--color-hairline)] flex items-center justify-between">
              <div>
                <div className="type-eyebrow !text-[var(--color-ink-muted)] mb-1">Farm details</div>
                <div className="type-body-muted">Used for weather, pest and crop advice.</div>
              </div>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="type-small inline-flex items-center gap-1.5 text-[var(--color-accent)] fade-in">
                    <Check size={14} /> Saved
                  </span>
                )}
                <Button type="submit">Save changes</Button>
              </div>
            </div>

            <div className="px-8 divide-y divide-[var(--color-hairline)]">
              <Field label="Name" hint="Shown only to you">
                <input className="input-clean" value={profile.name} onChange={handle('name')} placeholder="Anish" />
              </Field>
              <Field label="Location" hint="City, or city + state">
                <input className="input-clean" required value={profile.location} onChange={handle('location')} placeholder="Pune, Maharashtra" />
              </Field>
              <Field label="Primary crop">
                <div className="flex flex-wrap gap-2">
                  {crops.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProfile({ ...profile, crop: c })}
                      className={`pill !px-4 !py-2 transition-colors ${
                        profile.crop === c
                          ? 'bg-[var(--color-ink)] text-white'
                          : 'bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Farm size" hint="Total acres">
                <input type="number" className="input-clean max-w-[200px]" value={profile.size} onChange={handle('size')} placeholder="0.00" />
              </Field>
              <Field label="Notes" hint="Soil, techniques, quirks">
                <textarea rows={3} className="input-clean" value={profile.bio} onChange={handle('bio')} placeholder="Black cotton soil, micro-irrigation, kharif rotation…" />
              </Field>
            </div>
          </Card>
        </form>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="!p-6">
            <div className="type-eyebrow !text-[var(--color-ink-muted)] mb-2">Privacy</div>
            <div className="type-body-muted">
              Profile data lives in your browser. Nothing leaves your device unless you request a recommendation.
            </div>
          </Card>
          <Card className="!p-6">
            <div className="type-eyebrow !text-[var(--color-ink-muted)] mb-2">Tip</div>
            <div className="type-body-muted">
              The more precise your location and crop, the sharper the daily recommendation.
            </div>
          </Card>
        </div>
      </Section>
    </Page>
  );
};

export default Profile;
