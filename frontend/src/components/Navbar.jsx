import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm shadow-green-900/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 w-full h-16">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-green-900 dark:text-white tracking-tighter">AgriSmart AI</span>
          <nav className="hidden md:flex gap-6 items-center">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `font-sans text-sm font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400 pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                `font-sans text-sm font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400 pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300'}`
              }
            >
              Profile
            </NavLink>
            <NavLink 
              to="/disease" 
              className={({ isActive }) => 
                `font-sans text-sm font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400 pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300'}`
              }
            >
              Disease
            </NavLink>
            <NavLink 
              to="/alerts" 
              className={({ isActive }) => 
                `font-sans text-sm font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400 pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300'}`
              }
            >
              Alerts
            </NavLink>
            <NavLink 
              to="/schemes" 
              className={({ isActive }) => 
                `font-sans text-sm font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400 pb-1' : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-300'}`
              }
            >
              Schemes
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 text-on-surface-variant active:opacity-80">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 text-on-surface-variant active:opacity-80">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant">
            <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRO5iazW5urSQlbcKb08YuXONEkxoZX8y1_-72IM9c5c_OqvIOLjS3ZoCVZvpPDxA0wn5DUQCY1q4R4GOp9IdhjHqdAGzjGWdXqCukl18H61nE1JJdwppBbWDmaUpU88tgHs_zrOzRk5MwuQz3qKhIXhCVbQaKXgYsvUNdFf6osM68jqKl2B-y00EDy9Eg66GRq7Y9dpjE13p1maE4Cx2HWIACEJO3TSkPyB4SVokXKal2o2-9AwGcMMnBvLfrJzqNevKAqGGO8fOL"/>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
