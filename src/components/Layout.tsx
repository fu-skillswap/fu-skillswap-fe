import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, Bell, MessageSquare, Search, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (location.pathname.startsWith('/forum')) {
      navigate(`/forum?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/mentors?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-brand-text font-sans">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        
        {/* Top Header Bar for Desktop and Tablet */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-brand-border h-16 px-6 lg:px-8 shrink-0">
          {/* Center search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={location.pathname.startsWith('/forum') ? "Tìm kiếm chủ đề thảo luận..." : "Tìm kiếm kỹ năng, mentor..."}
              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/80 focus:border-slate-300 rounded-full py-1.5 pl-10 pr-4 text-xs font-medium focus:outline-none transition-all placeholder-slate-400"
            />
          </form>

          {/* Right utilities */}
          <div className="flex items-center gap-4.5">
            {/* Inbox / Chat shortcut */}
            <Link 
              to="/chat" 
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all relative"
              title="Tin nhắn"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
            </Link>

            {/* Notification bell */}
            <button 
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all relative cursor-pointer"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
            </button>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-all cursor-pointer focus:outline-none"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 text-left animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block truncate">{user.fullName}</span>
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block mt-0.5">
                        {user.roles?.[0] || 'MENTEE'}
                      </span>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Cài đặt tài khoản</span>
                    </Link>

                    <hr className="border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Mobile top navigation header */}
        <header className="md:hidden flex items-center justify-between bg-white border-b border-brand-border px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">///</span>
            <span className="text-sm font-bold tracking-tight text-slate-800">
              SkillSwap
            </span>
          </div>

          {user && (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
          )}
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-6 lg:px-8 focus:outline-none">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};
