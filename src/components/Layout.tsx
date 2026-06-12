import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, Bell, MessageSquare, Search, User, LogOut, Settings } from 'lucide-react';
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
        <header className="hidden md:flex items-center justify-between bg-white h-16 px-6 lg:px-8 shrink-0 relative">
          
          {/* Left placeholder to balance centering */}
          <div className="w-24 md:w-32 lg:w-48 shrink-0"></div>

          {/* Center search bar absolutely centered in header */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-450" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={location.pathname.startsWith('/forum') ? "Tìm kiếm chủ đề thảo luận..." : "Tìm kiếm kỹ năng, mentor..."}
                className="w-full bg-[#f1f5f9] hover:bg-slate-200/50 focus:bg-white border border-transparent focus:border-slate-350 rounded-full py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none transition-all placeholder-slate-400"
              />
            </form>
          </div>

          {/* Right utilities */}
          <div className="flex items-center gap-3.5 z-10 shrink-0">
            {/* Inbox / Chat shortcut */}
            <Link 
              to="/chat" 
              className="p-2.5 bg-[#f1f5f9] text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-full transition-all relative"
              title="Tin nhắn"
            >
              <MessageSquare className="w-4.5 h-4.5" />
            </Link>

            {/* Notification bell */}
            <button 
              className="p-2.5 bg-[#f1f5f9] text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-full transition-all relative cursor-pointer"
              title="Thông báo"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="relative flex items-center p-0.5 rounded-full hover:opacity-90 transition-all cursor-pointer focus:outline-none"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 text-left animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block truncate">{user.fullName}</span>
                      <span className="text-[10px] text-brand-primary font-extrabold uppercase tracking-wider block mt-0.5">
                        {user.roles?.[0] || 'MENTEE'}
                      </span>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-primary transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-primary transition-all"
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
          
          <div className="flex items-center gap-2.5">
            <img src="/SkillSwapLogo.png" alt="SkillSwap Logo" className="w-8 h-8 object-contain" />
            <span className="text-sm font-bold tracking-tight text-brand-primary">
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
