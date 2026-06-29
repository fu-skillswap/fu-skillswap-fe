import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Menu, MessageSquare, User, LogOut, Settings, HelpCircle, Share2, ScrollText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { CreditWalletBadge } from './CreditWalletBadge';
import { MobileTabBar } from './MobileTabBar';
import { onAvatarError } from '../lib/img';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAvatarOpen, setMobileAvatarOpen] = useState(false);

  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileAvatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) setMobileMenuOpen(false);
      if (mobileAvatarRef.current && !mobileAvatarRef.current.contains(event.target as Node)) setMobileAvatarOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'SkillSwap', url: window.location.origin });
    } else {
      navigator.clipboard.writeText(window.location.origin);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app text-fg font-sans">
      {/* Sidebar chỉ hiện trên desktop */}
      <div className="hidden md:block">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Desktop header */}
        <header className="hidden md:flex items-center bg-transparent h-18 px-6 lg:px-8 shrink-0">
          <div className="max-w-7xl mx-auto w-full flex justify-end items-center">
            <div className="flex items-center justify-end gap-5">
              <ThemeSwitcher />
              <CreditWalletBadge variant="chip" />
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
                    <img src={user.avatarUrl} onError={onAvatarError} alt={user.fullName} className="w-9 h-9 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface"></span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-surface border border-line rounded-card shadow-xl py-2 z-50 text-left animate-fadeIn">
                      <div className="px-4 py-2.5 border-b border-line-soft">
                        <span className="text-body font-bold text-fg block truncate">{user.fullName}</span>
                        <span className="text-meta text-primary font-extrabold uppercase tracking-wider block mt-0.5">{user.roles?.[0] || 'MENTEE'}</span>
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
        <header className="md:hidden flex items-center justify-between bg-app px-4 py-3 shrink-0 border-b border-line-soft">
          {/* Hamburger → dropdown nhỏ */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-1.5 rounded-field hover:bg-surface-muted text-fg-muted hover:text-fg"
            >
              <Menu className="w-6 h-6" />
            </button>
            {mobileMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-surface border border-line rounded-card shadow-xl py-1.5 z-50 animate-fadeIn text-left">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg transition-all"
                >
                  <Settings className="w-4.5 h-4.5 shrink-0" /><span>Cài đặt</span>
                </Link>
                <Link
                  to="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg transition-all"
                >
                  <HelpCircle className="w-4.5 h-4.5 shrink-0" /><span>Trung tâm hỗ trợ</span>
                </Link>
                <Link
                  to="/terms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg transition-all"
                >
                  <ScrollText className="w-4.5 h-4.5 shrink-0" /><span>Nội quy</span>
                </Link>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 px-4 py-3 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-fg transition-all"
                >
                  <Share2 className="w-4.5 h-4.5 shrink-0" /><span>Chia sẻ ứng dụng</span>
                </button>
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="SkillSwap Logo" className="w-8 h-8 object-contain" />
            <span className="text-title font-bold tracking-tight text-primary">SkillSwap</span>
          </div>

          {/* Avatar → dropdown */}
          {user ? (
            <div className="relative" ref={mobileAvatarRef}>
              <button
                onClick={() => setMobileAvatarOpen((o) => !o)}
                className="relative flex items-center p-0.5 rounded-full hover:opacity-90 transition-all cursor-pointer focus:outline-none"
              >
                <img src={user.avatarUrl} onError={onAvatarError} alt={user.fullName} className="w-8 h-8 rounded-full object-cover border border-line" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-success rounded-full border-2 border-surface"></span>
              </button>
              {mobileAvatarOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-surface border border-line rounded-card shadow-xl py-2 z-50 animate-fadeIn text-left">
                  <div className="px-4 py-2.5 border-b border-line-soft">
                    <span className="text-body font-bold text-fg block truncate">{user.fullName}</span>
                    <span className="text-meta text-primary font-extrabold uppercase tracking-wider block mt-0.5">{user.roles?.[0] || 'MENTEE'}</span>
                  </div>
                  {/* SCoin vẫn ở trong dropdown trên mobile */}
                  <CreditWalletBadge variant="row" />
                  <Link to="/profile" onClick={() => setMobileAvatarOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-primary transition-all">
                    <User className="w-4.5 h-4.5" /><span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link to="/settings" onClick={() => setMobileAvatarOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-primary transition-all">
                    <Settings className="w-4.5 h-4.5" /><span>Cài đặt tài khoản</span>
                  </Link>
                  <hr className="border-line-soft my-1" />
                  <button
                    onClick={() => { setMobileAvatarOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-danger hover:bg-danger/10 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" /><span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-8" />
          )}
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
