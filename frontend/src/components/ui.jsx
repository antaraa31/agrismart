import React from 'react';

export const Page = ({ children, className = '' }) => (
  <main className={`max-w-[1120px] mx-auto px-6 sm:px-10 pt-14 pb-24 ${className}`}>
    {children}
  </main>
);

export const Section = ({ children, className = '' }) => (
  <section className={`mb-16 ${className}`}>{children}</section>
);

export const Hero = ({ eyebrow, title, subtitle, align = 'left', children }) => (
  <header className={`mb-14 ${align === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-3xl'}`}>
    {eyebrow && <div className="type-eyebrow mb-4">{eyebrow}</div>}
    <h1 className="type-hero mb-5">{title}</h1>
    {subtitle && <p className="type-body-muted text-[19px] leading-snug">{subtitle}</p>}
    {children && <div className="mt-8">{children}</div>}
  </header>
);

export const Card = ({ children, className = '', as: Tag = 'div', onClick, hoverLift = false }) => (
  <Tag
    onClick={onClick}
    className={`card-surface p-8 ${hoverLift ? 'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.08)]' : ''} ${className}`}
  >
    {children}
  </Tag>
);

export const Stat = ({ label, value, unit, sub, accent = false }) => (
  <div className="flex flex-col gap-2">
    <div className="type-caption">{label}</div>
    <div className="flex items-baseline gap-1.5">
      <span className={`type-h1 tabular-nums ${accent ? 'text-[var(--color-accent)]' : ''}`}>{value}</span>
      {unit && <span className="type-small text-[15px] text-[var(--color-ink-muted)]">{unit}</span>}
    </div>
    {sub && <div className="type-caption">{sub}</div>}
  </div>
);

const toneMap = {
  accent:  { bg: 'var(--color-accent-soft)',  fg: 'var(--color-accent)' },
  warn:    { bg: 'var(--color-warn-soft)',    fg: 'var(--color-warn)' },
  danger:  { bg: 'var(--color-danger-soft)',  fg: 'var(--color-danger)' },
  good:    { bg: 'var(--color-good-soft)',    fg: 'var(--color-good)' },
  neutral: { bg: 'var(--color-surface-alt)',  fg: 'var(--color-ink-muted)' },
};

export const Tag = ({ tone = 'neutral', children, dot = false }) => {
  const c = toneMap[tone] || toneMap.neutral;
  return (
    <span className="pill" style={{ background: c.bg, color: c.fg }}>
      {dot && <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: c.fg }} />}
      {children}
    </span>
  );
};

export const Button = ({ as: Tag = 'button', variant = 'primary', children, className = '', ...rest }) => (
  <Tag className={`${variant === 'secondary' ? 'btn-secondary' : variant === 'link' ? 'btn-link' : 'btn-primary'} ${className}`} {...rest}>
    {children}
  </Tag>
);

export const Divider = ({ className = '' }) => (
  <div className={`h-px bg-[var(--color-hairline)] ${className}`} />
);

export const Row = ({ label, value, mono = false }) => (
  <div className="flex items-baseline justify-between py-3 border-b border-[var(--color-hairline)] last:border-0">
    <span className="type-small">{label}</span>
    <span className={`type-body text-right ${mono ? 'tabular-nums' : ''}`}>{value}</span>
  </div>
);

export const Empty = ({ title, hint, icon }) => (
  <div className="py-20 text-center">
    {icon && <div className="mx-auto mb-5 w-10 h-10 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-[var(--color-ink-subtle)]">{icon}</div>}
    <h3 className="type-h3 mb-2">{title}</h3>
    {hint && <p className="type-body-muted max-w-sm mx-auto">{hint}</p>}
  </div>
);
