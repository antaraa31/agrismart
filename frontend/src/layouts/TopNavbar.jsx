import { Link, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function TopNavbar() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/profile', label: 'Profile' },
    { path: '/disease', label: 'Disease Detection' },
    { path: '/alerts', label: 'Pest Alerts' },
    { path: '/news', label: 'Schemes' }
  ];

  return (
    <header className="h-20 w-full bg-white border-b border-slate-100 flex items-center justify-between px-8 md:px-16 lg:px-32 z-40 sticky top-0 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-emerald-500">
          <Leaf fill="currentColor" size={32} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-emerald-600">
          Agri<span className="text-slate-800">Smart</span>
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <nav className="flex items-center gap-6">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`text-sm font-semibold transition-colors ${
                location.pathname.startsWith(item.path) ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="bg-[#78d05e] hover:bg-[#68bd4f] text-white font-bold py-2 px-6 rounded text-sm transition-colors shadow-sm">
          Login
        </button>
      </div>
      
      {/* Mobile Menu Button - simplified for layout purposes */}
      <button className="md:hidden text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </header>
  );
}
