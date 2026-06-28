import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Menu, MessageSquare, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { CreditWalletBadge } from './CreditWalletBadge';
import { MobileTabBar } from './MobileTabBar';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app text-fg font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Desktop / tablet header */}
        <header className="hidden md:flex items-center bg-transparent h-18 px-6 lg:px-8 shrink-0">
          <div className="max-w-7xl mx-auto w-full flex justify-end items-center">
            {/* Right utilities */}
            <div className="flex items-center justify-end gap-5">
              <ThemeSwitcher />
              <Link to="/chat" title="Tin nhắn" className="p-2.5 bg-surface border border-line text-fg-muted hover:text-fg rounded-full transition-all relative">
                <MessageSquare className="w-5 h-5" />
              </Link>

              <NotificationBell />

              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="relative flex items-center p-0.5 rounded-full hover:opacity-90 transition-all cursor-pointer focus:outline-none"
                  >
                    <img src={user.avatarUrl} alt={user.fullName} className="w-9 h-9 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface"></span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-surface border border-line rounded-card shadow-xl py-2 z-50 text-left animate-fadeIn">
                      <div className="px-4 py-2.5 border-b border-line-soft">
                        <span className="text-body font-bold text-fg block truncate">{user.fullName}</span>
                        <span className="text-meta text-primary font-extrabold uppercase tracking-wider block mt-0.5">
                          {user.roles?.[0] || 'MENTEE'}
                        </span>
                      </div>
                      <CreditWalletBadge variant="row" />
                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-primary transition-all">
                        <User className="w-4.5 h-4.5" /><span>Hồ sơ cá nhân</span>
                      </Link>
                      <Link to="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-primary transition-all">
                        <Settings className="w-4.5 h-4.5" /><span>Cài đặt tài khoản</span>
                      </Link>
                      <hr className="border-line-soft my-1" />
                      <button
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-danger hover:bg-danger/10 transition-all text-left cursor-pointer"
                      >
                        <LogOut className="w-4.5 h-4.5" /><span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between bg-app px-4 py-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-field hover:bg-surface-muted text-fg-muted hover:text-fg">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="SkillSwap Logo" className="w-8 h-8 object-contain" />
            <span className="text-title font-bold tracking-tight text-primary">SkillSwap</span>
          </div>
          <Link to="/chat" title="Tin nhắn" className="p-1.5 rounded-field text-fg-muted hover:text-fg relative">
            <MessageSquare className="w-6 h-6" />
          </Link>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-28 md:px-6 md:py-7 lg:px-8 focus:outline-none">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <MobileTabBar />
      </div>
    </div>
  );
};
