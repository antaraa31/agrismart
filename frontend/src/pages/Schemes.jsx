import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Filter } from 'lucide-react';
import { Page, Hero, Section, Card, Tag, Empty } from '../components/ui';
import Loader from '../components/Loader';

const tone = (c) => (c === 'scheme' ? 'accent' : c === 'pest' ? 'danger' : c === 'weather' ? 'warn' : 'neutral');
const label = (c) => (c === 'scheme' ? 'Scheme' : c === 'pest' ? 'Pest alert' : c === 'weather' ? 'Weather' : 'News');

const Schemes = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const r = await fetch('http://localhost:5000/api/agri-news');
        const data = await r.json();
        if (r.ok) setItems(data.data || []);
      } catch (err) {
        console.error('Schemes error:', err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = filter === 'all' ? items : items.filter((n) => n.category === filter);
  const categories = ['all', 'scheme', 'weather', 'pest'];

  return (
    <Page>
      <Hero
        eyebrow="Government & news"
        title="What's moving in your region."
        subtitle="Schemes, subsidies, weather advisories and pest reports — filtered to what matters for you."
      />

      <Section>
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          <span className="inline-flex items-center gap-1.5 type-caption mr-1">
            <Filter size={12} /> Filter
          </span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`pill transition-colors ${
                filter === c
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]'
              }`}
            >
              {c === 'all' ? 'All' : label(c)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="!p-6"><div className="h-5 w-24 skel mb-4" /><div className="h-6 w-full skel mb-2" /><div className="h-6 w-4/5 skel mb-6" /><div className="h-4 w-full skel mb-2" /><div className="h-4 w-3/4 skel" /></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card><Empty title="Nothing here" hint="No articles match this filter yet." /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((n, i) => (
              <a
                key={i}
                href={n.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Card hoverLift className="!p-6 h-full flex flex-col fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <Tag tone={tone(n.category)}>{label(n.category)}</Tag>
                    {typeof n.relevanceScore === 'number' && (
                      <span className="type-caption tabular-nums">{n.relevanceScore}</span>
                    )}
                  </div>
                  <h3 className="type-h3 mb-3 line-clamp-3">{n.title}</h3>
                  <p className="type-small flex-1 line-clamp-3 mb-5">{n.summary || n.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-hairline)] mt-auto">
                    <span className="type-caption">{n.source?.name || 'News'} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Recent'}</span>
                    <ArrowUpRight size={16} className="text-[var(--color-ink-muted)]" />
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </Section>
    </Page>
  );
};

export default Schemes;
