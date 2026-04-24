import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Filter } from 'lucide-react';
import { Page, Hero, Section, Card, Tag, Empty } from '../components/ui';
import Loader from '../components/Loader';

const tone = (c) => (c === 'scheme' ? 'accent' : c === 'pest' ? 'danger' : c === 'weather' ? 'warn' : 'neutral');
const label = (c) => (c === 'scheme' ? 'Scheme' : c === 'pest' ? 'Pest alert' : c === 'weather' ? 'Weather' : 'News');

const Schemes = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(schemes);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? items : items.filter((n) => n.category === filter);
  const categories = ['all', 'scheme'];

  return (
    <Page>
      <Hero
        eyebrow="Government Schemes"
        title="Farmer Support Programs"
        subtitle="Central and state government schemes, subsidies, and assistance programs for Indian farmers."
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
              {c === 'all' ? 'All' : 'Scheme'}
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
          <Card><div className="text-center py-10 text-[var(--color-ink-muted)]">No schemes available</div></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((scheme, i) => (
              <Card key={i} hoverLift className="!p-0 h-full flex flex-col fade-in overflow-hidden">
                {scheme.image && (
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={scheme.image} 
                      alt={scheme.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="!p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Tag tone="accent">Scheme</Tag>
                  </div>
                  <h3 className="type-h3 mb-2 line-clamp-2">{scheme.name}</h3>
                  <p className="type-small flex-1 line-clamp-3 mb-4">{scheme.description}</p>
                  <div className="space-y-2 pt-4 border-t border-[var(--color-hairline)] mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="type-caption text-[var(--color-ink-muted)]">Benefit:</span>
                      <span className="type-small font-medium">{scheme.benefit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="type-caption text-[var(--color-ink-muted)]">Eligibility:</span>
                      <span className="type-small">{scheme.eligibility}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </Page>
  );
};

export default Schemes;
