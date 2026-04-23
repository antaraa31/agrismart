export function Input({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative w-full">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
      <input 
        className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm text-sm ${Icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}
