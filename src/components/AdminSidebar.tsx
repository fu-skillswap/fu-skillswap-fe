import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Users, Settings, X } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin/mentor-verification') {
      return location.pathname.startsWith('/admin/mentor-verification');
    }
    return location.pathname === path;
  };

  const linkClass = (path: string) => {
    return `flex items-center gap-3 px-4 py-3 rounded-lg text-body font-bold transition-all duration-200 ${
      isActive(path)
        ? 'text-white bg-primary font-bold shadow-sm'
        : 'text-text-muted hover:text-white hover:bg-primary'
    }`;
  };

  const adminLinks = [
    { path: '/admin/mentor-verification', label: 'Duyệt hồ sơ Mentor', icon: <ShieldCheck className="w-5 h-5" /> },
    { path: '/admin/mentor-list', label: 'Quản lý Mentor', icon: <GraduationCap className="w-5 h-5" /> },
    { path: '/admin/users', label: 'Quản lý Mentee', icon: <Users className="w-5 h-5" /> },
    { path: '/admin/settings', label: 'Cài đặt', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-surface-container-lowest border-r border-surface-border flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:h-screen shrink-0 text-left`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/admin/mentor-verification" onClick={onClose} className="flex items-center gap-2.5 group text-left">
              <img src="/logo.svg" alt="SkillSwap Logo" className="w-11 h-11 object-contain" />
              <div className="flex flex-col">
                <span className="text-head font-extrabold tracking-tight text-primary leading-none">SkillSwap</span>
                <span className="text-[10px] text-text-muted mt-1 font-semibold tracking-wide">Admin Control Panel</span>
              </div>
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
            {adminLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={onClose} className={linkClass(link.path)}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
