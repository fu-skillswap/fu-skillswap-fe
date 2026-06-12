import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck, X, BarChart3, Users, FileCheck, Calendar,
  ListTodo, Sliders, Bookmark, MessageSquare, Send, Home, User,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `flex items-center gap-4 py-3 px-4 rounded-field text-body font-bold transition-all duration-200 ${
      isActive(path)
        ? 'text-fg bg-surface-muted font-extrabold'
        : 'text-fg-muted hover:text-fg hover:bg-surface-muted'
    }`;

  const handlePostClick = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-post-composer'));
  };

  const getNavLinks = () => {
    const role = user?.roles?.[0] || 'MENTEE';

    if (role === 'ADMIN') {
      return [
        { path: '/admin/metrics', label: 'Chỉ số hệ thống', icon: <BarChart3 className="w-5 h-5" /> },
        { path: '/admin/users', label: 'Quản lý người dùng', icon: <Users className="w-5 h-5" /> },
        { path: '/admin/verifications', label: 'Yêu cầu phê duyệt', icon: <FileCheck className="w-5 h-5" /> },
      ];
    }

    if (role === 'MENTOR') {
      return [
        { path: '/dashboard', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
        { path: '/forum', label: 'Diễn đàn học tập', icon: <MessageSquare className="w-5 h-5" /> },
        { path: '/chat', label: 'Trò chuyện', icon: <Send className="w-5 h-5" /> },
        { path: '/mentor/slots', label: 'Khung giờ rảnh', icon: <Calendar className="w-5 h-5" /> },
        { path: '/mentor/bookings', label: 'Lịch dạy của tôi', icon: <ListTodo className="w-5 h-5" /> },
        { path: '/mentor/profile-setup', label: 'Cấu hình chuyên môn', icon: <Sliders className="w-5 h-5" /> },
        { path: '/profile', label: 'Hồ sơ cá nhân', icon: <User className="w-5 h-5" /> },
      ];
    }

    return [
      { path: '/dashboard', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
      { path: '/mentors', label: 'Khám phá Mentor', icon: <UserCheck className="w-5 h-5" /> },
      { path: '/forum', label: 'Diễn đàn học tập', icon: <MessageSquare className="w-5 h-5" /> },
      { path: '/chat', label: 'Trò chuyện', icon: <Send className="w-5 h-5" /> },
      { path: '/mentee/bookings', label: 'Lịch học của tôi', icon: <Bookmark className="w-5 h-5" /> },
      { path: '/profile', label: 'Hồ sơ cá nhân', icon: <User className="w-5 h-5" /> },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface md:bg-transparent flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:h-screen shrink-0`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 group text-left">
              <img src="/SkillSwapLogo.png" alt="SkillSwap Logo" className="w-11 h-11 object-contain" />
              <span className="text-head font-extrabold tracking-tight text-primary leading-none">SkillSwap</span>
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded-field hover:bg-surface-muted text-fg-muted hover:text-fg md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1 scrollbar-none">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={onClose} className={linkClass(link.path)}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}

            {user?.roles?.[0] !== 'ADMIN' && (
              <button
                onClick={handlePostClick}
                className="w-full bg-action hover:bg-action-hover text-on-action rounded-pill py-3.5 px-4 text-body font-bold transition-all active:scale-95 cursor-pointer mt-5"
              >
                Đăng tin
              </button>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-line-soft flex flex-col gap-2 mt-auto text-left">
          <Link to="/settings" onClick={onClose} className="py-1 px-4 text-body font-bold text-fg-muted hover:text-fg transition-colors">
            Cài đặt
          </Link>
          <a
            href="#help"
            onClick={(e) => { e.preventDefault(); onClose(); alert('Đang chuyển hướng tới Trung tâm hỗ trợ SkillSwap...'); }}
            className="py-1 px-4 text-body font-bold text-fg-muted hover:text-fg transition-colors"
          >
            Trung tâm hỗ trợ
          </a>
          <button
            onClick={() => { onClose(); navigator.clipboard.writeText(window.location.origin); alert('Đã sao chép link mời bạn bè tham gia SkillSwap!'); }}
            className="py-1 px-4 text-body font-bold text-fg-muted hover:text-fg transition-colors text-left w-full cursor-pointer"
          >
            Mời bạn bè
          </button>
        </div>
      </aside>
    </>
  );
};
