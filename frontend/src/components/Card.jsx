export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-center gap-3 border-b border-slate-100 pb-4 mb-5 px-6 pt-6 ${className}`}>
      {Icon && <Icon className="text-emerald-600" size={22} />}
      <h3 className="text-lg font-semibold text-slate-800 tracking-tight">{title}</h3>
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 pb-6 ${className}`}>
      {children}
    </div>
  );
}
