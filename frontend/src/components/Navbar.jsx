import React from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const links = [
  { to: '/',         label: 'Dashboard' },
  { to: '/alerts',   label: 'Alerts' },
  { to: '/disease',  label: 'Disease' },
  { to: '/schemes',  label: 'Schemes' },
  { to: '/profile',  label: 'Profile' },
];

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-[rgba(251,251,253,0.72)] backdrop-blur-xl border-b border-[var(--color-hairline)]">
      <div className="max-w-[1120px] mx-auto px-6 sm:px-10 h-12 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-[var(--color-ink)] hover:opacity-80 transition-opacity">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[var(--color-accent)] text-white">
            <Leaf size={14} strokeWidth={2.5} />
          </span>
          <span className="font-[var(--font-display)] text-[15px] font-semibold tracking-tight">AgriSmart</span>
        </NavLink>

        <nav className="hidden sm:flex items-center gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `relative px-3 py-1.5 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200 ${
                  isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute left-3 right-3 -bottom-[13px] h-[2px] bg-[var(--color-ink)] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <nav className="sm:hidden flex items-center gap-3 overflow-x-auto">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `text-[13px] font-medium ${isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
