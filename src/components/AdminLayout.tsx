import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Menu, Bell, Search, LogOut, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    <div className="flex h-screen w-screen overflow-hidden bg-app text-fg font-sans admin-page">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Desktop / tablet header */}
        <header className="hidden md:flex items-center bg-transparent h-18 px-6 lg:px-8 shrink-0">
          <div className="max-w-7xl mx-auto w-full flex lg:grid lg:grid-cols-3 gap-6 items-center">
            {/* Search */}
            <div className="relative flex-1 lg:col-span-2 max-w-xs text-left">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-surface-container-lowest border border-surface-border rounded-full py-2.5 pl-11 pr-5 text-sm font-semibold text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted"
              />
            </div>

            {/* Right utilities */}
            <div className="flex items-center justify-end gap-5 lg:col-span-1">
              <span className="text-body font-semibold text-text-muted select-none whitespace-nowrap">
                Admin
              </span>
              <span className="text-body font-bold text-primary border-b-2 border-primary pb-1 mr-2 select-none whitespace-nowrap">
                Verification
              </span>
              <button title="Thông báo" className="text-text-muted hover:text-text-main transition-colors relative cursor-pointer focus:outline-none">
                <Bell className="w-5 h-5" />
              </button>
              <button title="Trợ giúp" className="text-text-muted hover:text-text-main transition-colors cursor-pointer focus:outline-none">
                <HelpCircle className="w-5 h-5" />
              </button>
              <ThemeSwitcher />

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
                          {user.roles?.[0] || 'ADMIN'}
                        </span>
                      </div>
                      <Link to="/admin/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-fg-muted hover:bg-surface-muted hover:text-primary transition-all">
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
          {user && <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover border border-line" />}
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-7 lg:px-8 focus:outline-none">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
