import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Star, Check, Compass, Sparkles, Smile, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { onAvatarError } from '../lib/img';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const mockTopMentors = [
    {
      name: 'Trần Hoàng Long',
      role: 'Mentor AI/ML',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
      skills: ['Python', 'PyTorch', 'SQL'],
      rating: 4.9,
      reviews: 12,
      bio: 'Sinh viên năm 4 K18, đạt giải nghiên cứu khoa học. Chuyên hướng dẫn làm đồ án AI và muốn swap kỹ năng thiết kế UI/UX.'
    },
    {
      name: 'Lê Minh Hương',
      role: 'Mentor Fullstack',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
      skills: ['React', 'Node.js', 'MongoDB'],
      rating: 4.8,
      reviews: 8,
      bio: 'Chuyên về web app, có 1 năm kinh nghiệm làm freelancer. Muốn học hỏi thêm về DevOps và bảo mật mạng.'
    },
    {
      name: 'Phạm Thùy Linh',
      role: 'Mentor Digital Marketing',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linh',
      skills: ['SEO', 'Google Ads', 'Figma'],
      rating: 4.9,
      reviews: 5,
      bio: 'Có kinh nghiệm chạy chiến dịch marketing thực tế. Muốn học lập trình Python cơ bản để làm phân tích dữ liệu.'
    }
  ];

  return (
    <div className="min-h-screen bg-surface-muted text-brand-text font-sans selection:bg-brand-primary selection:text-white">
      
      {/* Public Header */}
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-line transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="SkillSwap Logo" className="w-11 h-11 object-contain" />
            <span className="text-lg font-bold tracking-tight text-brand-primary">
              SkillSwap
            </span>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-body font-bold text-fg-muted">
            <a href="#about" className="hover:text-fg transition-colors">Về chúng tôi</a>
            <a href="#features" className="hover:text-fg transition-colors">Tính năng chính</a>
            <a href="#mentors" className="hover:text-fg transition-colors">Mentor tiêu biểu</a>
            <a href="#stats" className="hover:text-fg transition-colors">Số liệu thống kê</a>
          </nav>

          {/* CTA / Tài khoản */}
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-hover text-white text-body font-bold py-2 px-5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Vào Dashboard
                </Link>

                {/* Avatar tài khoản + dropdown đăng xuất */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-2 py-1 pl-1 pr-2 rounded-full border border-line hover:bg-surface-muted transition-all cursor-pointer"
                  >
                    <img
                      src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                      onError={onAvatarError}
                      alt={user?.fullName || ''}
                      className="w-8 h-8 rounded-full object-cover border border-line"
                    />
                    <span className="hidden sm:block text-body font-bold text-fg max-w-[120px] truncate">{user?.fullName}</span>
                    <ChevronDown className={`w-4 h-4 text-fg-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-card shadow-xl p-2 z-50 text-left">
                      <div className="px-3 py-2 border-b border-line-soft">
                        <p className="text-body font-bold text-fg truncate">{user?.fullName}</p>
                        <p className="text-meta text-fg-muted truncate">{user?.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-field text-fg hover:bg-surface-muted font-bold text-body">
                        <ArrowRight className="w-4 h-4" /> Vào Dashboard
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-field text-danger hover:bg-danger/10 font-bold text-body cursor-pointer">
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-brand-primary hover:bg-brand-primary-hover text-white text-body font-bold py-2 px-5.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Đăng nhập ngay
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section — nền gradient (bỏ ảnh campus để tránh dấu vết thương hiệu trường) */}
      <section
        className="relative overflow-hidden text-white py-28 lg:py-36 text-left"
        style={{ background: 'linear-gradient(120deg, #051138 0%, #0a2a6e 55%, #1e3a8a 105%)' }}
      >
        {/* Hoạ tiết chấm + overlay cho chiều sâu */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1.4px)', backgroundSize: '22px 22px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#051138]/90 via-[#051138]/40 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content Left */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-meta font-extrabold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md shadow-brand-primary/25 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Cộng đồng trao đổi kỹ năng học thuật
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight">
              Kiến thức của bạn,<br />
              <span className="text-brand-secondary">Kỹ năng</span> của bạn học
            </h1>
            
            <p className="text-slate-200 text-body sm:text-body font-semibold max-w-xl leading-relaxed">
              SkillSwap là nền tảng trao đổi kỹ năng chéo học thuật dành cho sinh viên đại học.
              Bạn chia sẻ thế mạnh lập trình, đổi lấy sự trợ giúp về thiết kế UI/UX hay ngoại ngữ từ bạn cùng trường.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white text-body font-bold py-3.5 px-7 rounded-full shadow-lg shadow-brand-primary/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Bắt đầu trao đổi ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center bg-surface/10 hover:bg-surface/20 border border-white/20 text-white text-body font-bold py-3.5 px-7 rounded-full active:scale-95 transition-all backdrop-blur-xs"
              >
                Tìm hiểu cơ chế
              </a>
            </div>
          </div>

          {/* Hero illustration (tranh vẽ) */}
          <div className="hidden lg:flex justify-center items-center">
            <img src="/illustration-hero.svg" alt="Cộng đồng trao đổi kỹ năng" className="w-full max-w-lg drop-shadow-2xl animate-fadeIn" />
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section id="stats" className="py-12 bg-surface border-b border-line-soft">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-fg block">1,200+</span>
              <span className="text-meta font-bold text-fg-faint uppercase tracking-wider block">Giờ học trao đổi</span>
            </div>

            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-fg block">450+</span>
              <span className="text-meta font-bold text-fg-faint uppercase tracking-wider block">Thành viên cộng đồng</span>
            </div>

            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-fg block">80+</span>
              <span className="text-meta font-bold text-fg-faint uppercase tracking-wider block">Mentor được duyệt</span>
            </div>

            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-fg block">4.85 / 5</span>
              <span className="text-meta font-bold text-fg-faint uppercase tracking-wider block">Điểm hài lòng</span>
            </div>

          </div>
        </div>
      </section>

      {/* About Platform Mechanism */}
      <section id="about" className="py-20 bg-surface-muted/50 text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6">
            <span className="inline-block text-meta font-extrabold text-fg bg-surface-muted border border-line py-1 px-3.5 rounded-full uppercase tracking-wider">
              Cơ chế vận hành
            </span>
            <h2 className="text-3xl font-bold text-fg tracking-tight leading-tight">
              Mô hình Trao đổi Kỹ năng Chéo hoạt động như thế nào?
            </h2>
            <p className="text-fg-muted text-body font-semibold leading-relaxed">
              SkillSwap loại bỏ rào cản chi phí trong gia sư học thuật bằng việc thiết lập vòng lặp chia sẻ kiến thức công bằng:
            </p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-muted border border-line text-fg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-body font-bold">1</span>
                </div>
                <div>
                  <span className="text-body font-bold text-fg block">Khai báo hồ sơ kỹ năng</span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Bạn cập nhật các kỹ năng bản thân đã thành thạo (được chứng thực qua môn học) và các kỹ năng bạn mong muốn học tập.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-muted border border-line text-fg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-body font-bold">2</span>
                </div>
                <div>
                  <span className="text-body font-bold text-fg block">Ghép cặp thông minh</span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Thuật toán tự động quét dữ liệu và đề xuất các bạn cùng trường có nhu cầu trao đổi đối ứng (Kỹ năng có ⇄ Kỹ năng cần) phù hợp nhất với bạn.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-muted border border-line text-fg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-body font-bold">3</span>
                </div>
                <div>
                  <span className="text-body font-bold text-fg block">Gặp mặt trực tuyến & Trao đổi chéo</span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Mentor duyệt lịch hẹn, cung cấp phòng Google Meet/Zoom trực tiếp và hai bên tiến hành dạy - học lẫn nhau hoàn toàn miễn phí.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mockups / Match Visual Demo */}
          <div className="space-y-6">
            <div className="w-full bg-surface border border-line p-6 rounded-card shadow-[0_1px_3px_rgba(15,23,42,0.02)] relative space-y-5">
              <div className="flex items-center justify-between border-b border-line-soft pb-3">
                <span className="text-body font-bold text-fg flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-fg-muted animate-spin-slow" /> Mô phỏng thuật toán ghép cặp
                </span>
                <span className="text-meta bg-green-50 text-green-700 font-extrabold border border-green-200 px-2 py-0.5 rounded-lg">
                  98% Tương hợp
                </span>
              </div>

              {/* Match Visualization Demo */}
              <div className="space-y-4">
                {/* Mentee (You) */}
                <div className="flex items-center gap-3 p-3 bg-surface-muted border border-line rounded-card">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=mentee"
                    alt="Mentee"
                    className="w-8 h-8 rounded-full border border-line object-cover"
                  />
                  <div className="text-left">
                    <span className="text-body font-bold block">Bạn (Sinh viên K19)</span>
                    <span className="text-meta text-brand-primary font-bold">Thế mạnh: Figma UI/UX ⇄ Cần học: Python</span>
                  </div>
                </div>

                {/* Exchange Symbol */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-surface-muted border border-line flex items-center justify-center text-slate-705 shadow-2xs">
                    <span className="text-body font-extrabold">⇄</span>
                  </div>
                </div>

                {/* Mentor */}
                <div className="flex items-center gap-3 p-3 bg-surface-muted border border-line rounded-card">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=long"
                    alt="Mentor"
                    className="w-8 h-8 rounded-full border border-line object-cover"
                  />
                  <div className="text-left">
                    <span className="text-body font-bold block">Trần Hoàng Long (Sinh viên K18)</span>
                    <span className="text-meta text-green-600 font-bold">Thế mạnh: Python ⇄ Cần học: Figma</span>
                  </div>
                </div>
              </div>

              {/* Match Rationale text */}
              <div className="bg-surface-muted border border-slate-155 p-4 rounded-card text-meta text-fg-muted font-semibold space-y-1.5 text-left leading-normal">
                <p className="text-fg font-extrabold flex items-center gap-1 uppercase tracking-wider text-[8px] border-b border-line pb-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0 text-fg" /> Lý do đề xuất hệ thống
                </p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-fg-muted shrink-0 mt-0.5" /> <span>Bạn sở hữu kỹ năng Figma Long đang tìm kiếm.</span></p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-fg-muted shrink-0 mt-0.5" /> <span>Long sẵn sàng chia sẻ kỹ năng Python bạn đang cần.</span></p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-fg-muted shrink-0 mt-0.5" /> <span>Hai bạn cùng học tập tại Cơ sở TP. Hồ Chí Minh.</span></p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Core Features Grid */}
      <section id="features" className="py-20 bg-surface border-t border-line-soft text-left">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="inline-block text-meta font-extrabold text-fg-muted bg-surface-muted border border-line py-1 px-3.5 rounded-full uppercase tracking-wider">
              Môi trường phân quyền
            </span>
            <h2 className="text-3xl font-bold text-fg tracking-tight">Trải nghiệm phân vai trò tương tác</h2>
            <p className="text-fg-muted text-body sm:text-body font-semibold leading-relaxed">
              SkillSwap xây dựng hai vai trò tương thích, mô phỏng chính xác các hoạt động kết nối và trao đổi học thuật.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 max-w-3xl mx-auto">
            
            {/* Mentee card */}
            <div className="p-6 bg-surface border border-line rounded-card hover:border-brand-secondary hover:shadow-xs transition-all space-y-4">
              <div className="w-9 h-9 rounded-full bg-surface-muted text-brand-primary flex items-center justify-center font-bold">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Dành cho Mentee (Học viên)</h3>
              <ul className="space-y-2.5 text-body text-fg-muted font-semibold">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" /> <span>Tìm kiếm, lọc danh sách Mentor theo ngành.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-fg shrink-0 mt-0.5" /> <span>Xem độ tương hợp (%) và đánh giá lịch sử.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-fg shrink-0 mt-0.5" /> <span>Nộp đơn xin lên làm Mentor (kèm tài liệu).</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-fg shrink-0 mt-0.5" /> <span>Báo cáo kết quả và viết phản hồi công khai.</span></li>
              </ul>
            </div>

            {/* Mentor card */}
            <div className="p-6 bg-surface border border-line rounded-card hover:border-brand-secondary hover:shadow-xs transition-all space-y-4">
              <div className="w-9 h-9 rounded-full bg-surface-muted text-brand-primary flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-fg">Dành cho Mentor (Người dạy)</h3>
              <ul className="space-y-2.5 text-body text-fg-muted font-semibold">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" /> <span>Tạo lịch rảnh (Slots) theo ngày và giờ hẹn.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-fg shrink-0 mt-0.5" /> <span>Chấp nhận hoặc từ chối lịch kèm lý do.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-fg shrink-0 mt-0.5" /> <span>Cập nhật link phòng trực tuyến (Zoom/Meet).</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-fg shrink-0 mt-0.5" /> <span>Cấu hình portfolio, kinh nghiệm & dịch vụ.</span></li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Top Mentors spotlight */}
      <section id="mentors" className="py-20 bg-surface-muted text-left">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-2">
              <span className="inline-block text-meta font-extrabold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 py-1 px-3.5 rounded-full uppercase tracking-wider">
                Đội ngũ tinh hoa
              </span>
              <h2 className="text-3xl font-bold text-brand-text tracking-tight">Mentor tiêu biểu xuất sắc</h2>
              <p className="text-fg-muted text-body sm:text-body font-semibold">
                Các sinh viên khóa trên đạt kết quả GPA cao và có nhiều kinh nghiệm dự án thực tế.
              </p>
            </div>
            
            <Link
              to="/login"
              className="text-body font-bold text-brand-primary hover:text-brand-primary-hover hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Xem tất cả danh sách <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockTopMentors.map((m, idx) => (
              <div key={idx} className="bg-surface border border-line p-6 rounded-card space-y-5 flex flex-col justify-between hover:border-brand-secondary hover:shadow-xs transition-all relative overflow-hidden group">
                <div className="space-y-4">
                  {/* Avatar & Info */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-11 h-11 rounded-field bg-surface-muted object-cover border border-line"
                    />
                    <div className="text-left space-y-0.5">
                      <span className="text-body font-bold text-brand-text block group-hover:text-brand-primary transition-colors">{m.name}</span>
                      <span className="text-meta text-fg-faint font-extrabold uppercase block">{m.role}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-body font-bold text-brand-secondary">
                    <Star className="w-3.5 h-3.5 fill-brand-secondary text-brand-secondary" /> {m.rating}{' '}
                    <span className="text-fg-faint text-meta font-semibold">({m.reviews} đánh giá)</span>
                  </div>

                  {/* Bio */}
                  <p className="text-fg-muted text-body leading-relaxed font-semibold line-clamp-3">
                    "{m.bio}"
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.skills.map((s, sIdx) => (
                      <span key={sIdx} className="text-meta bg-surface-muted border border-line/85 text-fg-muted py-0.5 px-2 rounded-md font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-line-soft flex items-center justify-between text-body font-bold text-fg-muted">
                  <span className="text-meta text-green-600 flex items-center gap-1 font-bold">
                    <Smile className="w-4 h-4 shrink-0" /> Sẵn sàng trao đổi
                  </span>
                  
                  <Link
                    to="/login"
                    className="text-brand-primary hover:text-brand-primary-hover inline-flex items-center gap-1 cursor-pointer"
                  >
                    Xem lịch rảnh <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="py-20 bg-gradient-to-br from-brand-primary to-[#051138] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 space-y-6 relative">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Nâng cao năng lực học tập và kết nối hôm nay!
          </h2>
          <p className="text-white/80 text-body font-semibold max-w-md mx-auto leading-relaxed">
            Đăng nhập ngay để trải nghiệm các vai trò, đặt lịch học và trao đổi kiến thức học thuật cùng cộng đồng.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-brand-secondary hover:bg-brand-secondary-hover text-white text-body font-extrabold py-3.5 px-8 rounded-full shadow-xl shadow-brand-secondary/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>Truy cập hệ thống ngay</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="bg-[#051138] text-fg-faint py-12 text-left text-body">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="SkillSwap Logo" className="w-10 h-10 object-contain brightness-0 invert" />
              <span className="text-base font-bold text-white">
                SkillSwap
              </span>
            </div>
            <p className="leading-relaxed font-semibold">
              Cộng đồng trao đổi kỹ năng học thuật miễn phí dành cho sinh viên đại học.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-white font-bold block uppercase tracking-wider text-meta">Tài nguyên</span>
            <ul className="space-y-2 font-semibold">
              <li><a href="#about" className="hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Tính năng chính</a></li>
              <li><a href="#mentors" className="hover:text-white transition-colors">Đội ngũ Mentor</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-white font-bold block uppercase tracking-wider text-meta">Định hướng học tập</span>
            <ul className="space-y-2 font-semibold">
              <li><a href="#features" className="hover:text-white transition-colors">Trao đổi kỹ năng</a></li>
              <li><a href="#mentors" className="hover:text-white transition-colors">Tìm mentor</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Lộ trình học tập</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-white font-bold block uppercase tracking-wider text-meta">Liên hệ & Hỗ trợ</span>
            <p className="leading-relaxed font-semibold">
              Đội ngũ SkillSwap — dự án học tập thực chiến.<br />
              Email: support@skillswap.asia
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 text-center text-meta text-fg-muted font-semibold">
          © {new Date().getFullYear()} SkillSwap. Dự án học tập thực chiến EXE101. Bảo lưu mọi quyền.
        </div>
      </footer>

    </div>
  );
};
