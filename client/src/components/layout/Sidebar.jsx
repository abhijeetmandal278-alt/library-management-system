import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MdDashboard, MdMenuBook, MdQrCodeScanner, MdHistory, MdBarChart, MdFileDownload, MdClose, MdLibraryBooks } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: MdDashboard, exact: true },
    { name: 'Books', path: '/books', icon: MdMenuBook },
    { name: 'Issue Book', path: '/scanner', state: { activeTab: 'issue' }, icon: MdQrCodeScanner },
    { name: 'Return Book', path: '/scanner', state: { activeTab: 'return' }, icon: MdQrCodeScanner },
    { name: 'History', path: '/transactions', icon: MdHistory },
    { name: 'Reports', path: '/reports', icon: MdBarChart },
    { name: 'Export', path: '/export', icon: MdFileDownload },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <MdLibraryBooks className="w-8 h-8 text-indigo-500" />
            <span className="text-xl font-bold tracking-tight">LibraryMS</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 -mr-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            
            const isActive = location.pathname === item.path && 
              (item.state ? location.state?.activeTab === item.state.activeTab : true);
              
            return (
              <NavLink
                key={index}
                to={item.path}
                state={item.state}
                onClick={() => setIsOpen(false)}
                className={({ isActive: navActive }) => {
                  const isCurrent = item.state ? isActive : navActive;
                  return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isCurrent 
                      ? 'bg-indigo-600 text-white font-medium shadow-sm' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`;
                }}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold shadow-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role === 'admin' ? 'Administrator' : 'Librarian'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
