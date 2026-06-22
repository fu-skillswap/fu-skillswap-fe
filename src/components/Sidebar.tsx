import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type ActiveRole } from '../context/AuthContext';
import {
  UserCheck, X, Users, Calendar,
  ListTodo, Bookmark, MessageSquare, Send, Home, User, GraduationCap,
  ShieldCheck, Settings, BarChart3
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, activeRole, setActiveRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => {
    if (isAdmin) {
      return `flex items-center gap-3 px-4 py-3 rounded-lg text-body font-bold transition-all duration-200 ${
        isActive(path)
          ? 'text-white bg-primary font-bold'
          : 'text-text-muted hover:text-text-main hover:bg-surface-container'
      }`;
    }
    return `flex items-center gap-4 py-3 px-4 rounded-field text-body font-bold transition-all duration-200 ${
      isActive(path)
        ? 'text-fg bg-surface-muted font-extrabold'
        : 'text-fg-muted hover:text-fg hover:bg-surface-muted'
    }`;
  };

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('ADMIN') || roles.includes('SYSTEM_ADMIN');
  const isMentor = roles.includes('MENTOR');

  const adminLinks = [
    { path: '/admin/mentor-verification', label: 'Duyệt Mentor', icon: <ShieldCheck className="w-5 h-5" /> },
    { path: '/admin/mentor-list', label: 'Quản lý Mentor', icon: <GraduationCap className="w-5 h-5" /> },
    { path: '/admin/metrics', label: 'Chỉ số hệ thống', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/admin/users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  // Hồ sơ chuyên môn & xác thực mentor đã gộp vào tab "Hồ sơ Mentor" trong /profile,
  // nên cả 2 vai trò đều chỉ cần 1 mục "Hồ sơ cá nhân" duy nhất.
  const mentorLinks = [
    { path: '/dashboard', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
    { path: '/forum', label: 'Diễn đàn học tập', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/chat', label: 'Trò chuyện', icon: <Send className="w-5 h-5" /> },
    { path: '/mentor/slots', label: 'Khung giờ rảnh', icon: <Calendar className="w-5 h-5" /> },
    { path: '/bookings', label: 'Lịch của tôi', icon: <ListTodo className="w-5 h-5" /> },
    { path: '/profile', label: 'Hồ sơ cá nhân', icon: <User className="w-5 h-5" /> },
  ];

  const menteeLinks = [
    { path: '/dashboard', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
    { path: '/mentors', label: 'Khám phá Mentor', icon: <UserCheck className="w-5 h-5" /> },
    { path: '/forum', label: 'Diễn đàn học tập', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/chat', label: 'Trò chuyện', icon: <Send className="w-5 h-5" /> },
    { path: '/bookings', label: 'Lịch của tôi', icon: <Bookmark className="w-5 h-5" /> },
    { path: '/profile', label: 'Hồ sơ cá nhân', icon: <User className="w-5 h-5" /> },
  ];

  // Nav theo VAI TRÒ ĐANG HOẠT ĐỘNG (không phải role gốc): mentor có thể chuyển sang
  // chế độ Mentee để thấy "Khám phá Mentor" và đặt lịch. Account ADMIN vẫn được thêm
  // các tab quản trị bên dưới, không thay thế nav gốc.
  const navLinks = isMentor && activeRole === 'MENTOR' ? mentorLinks : menteeLinks;

  // Đổi vai trò + điều hướng tới nơi hợp lý cho vai trò đó.
  const switchTo = (role: ActiveRole) => {
    if (role === activeRole) return;
    setActiveRole(role);
    onClose();
    navigate(role === 'MENTEE' ? '/mentors' : '/dashboard');
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] ${
          isAdmin
            ? 'bg-surface-container-lowest border-r border-surface-border'
            : 'bg-surface md:bg-transparent'
        } flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:h-screen shrink-0`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to={isAdmin ? "/admin/mentor-verification" : "/dashboard"} onClick={onClose} className="flex items-center gap-2.5 group text-left">
              <img src="/logo.svg" alt="SkillSwap Logo" className="w-11 h-11 object-contain" />
              <div className="flex flex-col">
                <span className="text-head font-extrabold tracking-tight text-primary leading-none">SkillSwap</span>
                {isAdmin && <span className="text-[10px] text-text-muted mt-1 font-semibold tracking-wide">Admin Control Panel</span>}
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded-field hover:bg-surface-muted text-fg-muted hover:text-fg md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role switcher — chỉ hiện cho user có vai trò MENTOR (đóng được cả 2 vai) và không phải Admin */}
          {isMentor && !isAdmin && (
            <div className="mb-4">
              <p className="px-1 mb-1.5 text-meta font-bold uppercase tracking-wide text-fg-faint">Chế độ hoạt động</p>
              <div className="flex p-1 bg-surface-muted rounded-field gap-1">
                {([
                  { role: 'MENTOR' as ActiveRole, label: 'Mentor', icon: <GraduationCap className="w-4 h-4" /> },
                  { role: 'MENTEE' as ActiveRole, label: 'Mentee', icon: <UserCheck className="w-4 h-4" /> },
                ]).map((opt) => {
                  const selected = activeRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      onClick={() => switchTo(opt.role)}
                      title={opt.role === 'MENTEE' ? 'Chuyển sang Mentee để đặt lịch với mentor khác' : 'Chế độ Mentor'}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-meta font-bold transition-all cursor-pointer ${
                        selected ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
                      }`}
                    >
                      <span className={selected ? 'text-primary' : ''}>{opt.icon}</span>{opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1 scrollbar-none">
            {isAdmin ? (
              adminLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={onClose} className={linkClass(link.path)}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))
            ) : (
              navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={onClose} className={linkClass(link.path)}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))
            )}
          </nav>
        </div>

        {/* Footer */}
        {!isAdmin && (
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
        )}
      </aside>
    </>
  );
};

