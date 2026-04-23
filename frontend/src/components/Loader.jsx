import React from 'react';

const Loader = ({ type = 'spinner' }) => {
  if (type === 'card') {
    return (
      <div className="card-surface p-8 space-y-5">
        <div className="h-5 w-40 skel" />
        <div className="h-12 w-2/3 skel" />
        <div className="space-y-2 pt-4">
          <div className="h-4 w-full skel" />
          <div className="h-4 w-11/12 skel" />
          <div className="h-4 w-4/5 skel" />
        </div>
        <div className="pt-4 grid grid-cols-2 gap-4">
          <div className="h-14 skel rounded-xl" />
          <div className="h-14 skel rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === 'inline') {
    return (
      <span className="inline-flex items-center gap-2 text-[var(--color-ink-muted)] text-[13px]">
        <span className="w-3 h-3 rounded-full border-[1.5px] border-[var(--color-hairline-strong)] border-t-[var(--color-ink)] animate-spin" />
        Loading…
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 rounded-full border-[1.5px] border-[var(--color-hairline-strong)] border-t-[var(--color-ink)] animate-spin" />
    </div>
  );
};

export default Loader;
