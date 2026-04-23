import { Loader2 } from 'lucide-react';

export function Button({ children, loading, variant = 'primary', className = '', ...props }) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 outline-none disabled:opacity-60 disabled:cursor-not-allowed text-sm";
  
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm px-5 py-2.5",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5",
    outline: "border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 px-5 py-2.5"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
}
