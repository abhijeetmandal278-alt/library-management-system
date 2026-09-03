import React from 'react';
import { useLocation } from 'react-router-dom';
import { MdMenu, MdLogout } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/books')) return 'Books Management';
    if (path.startsWith('/scanner')) return 'Scanner & Issue/Return';
    if (path.startsWith('/transactions')) return 'Transaction History';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/export')) return 'Export Data';
    return 'Library Management';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
        >
          <MdMenu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4 text-sm font-medium">
        <span className="text-slate-600 hidden sm:inline-block">
          Hello, {user?.name || 'User'}
        </span>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 border border-slate-200 hover:border-red-100"
        >
          <MdLogout className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
