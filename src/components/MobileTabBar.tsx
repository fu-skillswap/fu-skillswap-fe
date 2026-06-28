import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UserCheck, Send, Bookmark, User, Calendar, BookOpen, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * MobileTabBar — thanh điều hướng dưới cùng cho bản mobile (md:hidden).
 * - Theo vai trò: đổi bộ tab khi activeRole = MENTOR (giống Sidebar).
 * - Tái dùng đúng route hiện có; chat truy cập qua icon ở header.
 * - Dùng semantic token (text-primary / text-fg-faint / bg-surface…) nên đổi theme là đổi theo.
 */

interface TabItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
}

const ICON = 'w-[22px] h-[22px]';

export const MobileTabBar: React.FC = () => {
  const { user, activeRole } = useAuth();
  const { pathname } = useLocation();

  const isMentor = !!user?.roles?.includes('MENTOR') && activeRole === 'MENTOR';

  const eq = (path: string) => (p: string) => p === path;
  const startsWith = (path: string) => (p: string) => p === path || p.startsWith(path + '/');
  const isHome = (p: string) => p === '/dashboard' || p === '/forum';

  const menteeTabs: TabItem[] = [
    { to: '/dashboard', label: 'Bảng tin', icon: <Home className={ICON} strokeWidth={2} />, match: isHome },
    { to: '/mentors', label: 'Mentor', icon: <UserCheck className={ICON} strokeWidth={2} />, match: eq('/mentors') },
    { to: '/chat', label: 'Trò chuyện', icon: <Send className={ICON} strokeWidth={2} />, match: eq('/chat') },
    { to: '/bookings', label: 'Lịch', icon: <Bookmark className={ICON} strokeWidth={2} />, match: eq('/bookings') },
    { to: '/profile', label: 'Hồ sơ', icon: <User className={ICON} strokeWidth={2} />, match: eq('/profile') },
  ];

  const mentorTabs: TabItem[] = [
    { to: '/dashboard', label: 'Tổng quan', icon: <Home className={ICON} strokeWidth={2} />, match: isHome },
    { to: '/bookings', label: 'Lịch dạy', icon: <Calendar className={ICON} strokeWidth={2} />, match: eq('/bookings') },
    { to: '/mentor/courses', label: 'Lớp học', icon: <BookOpen className={ICON} strokeWidth={2} />, match: startsWith('/mentor/courses') },
    { to: '/mentor/payout', label: 'Ví', icon: <Wallet className={ICON} strokeWidth={2} />, match: eq('/mentor/payout') },
    { to: '/profile', label: 'Hồ sơ', icon: <User className={ICON} strokeWidth={2} />, match: eq('/profile') },
  ];

  const tabs = isMentor ? mentorTabs : menteeTabs;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line-soft"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 20px rgba(15,23,42,.05)' }}
    >
      <div className="flex items-stretch justify-around px-1.5 pt-1.5 pb-2">
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-field transition-colors duration-200 ${
                active ? 'text-primary' : 'text-fg-faint hover:text-fg-muted'
              }`}
            >
              {t.icon}
              <span className="text-[10px] font-bold leading-none tracking-tight">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
