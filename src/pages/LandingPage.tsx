import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Star, Check, Compass, Sparkles, Smile, LogOut, ChevronDown, UserCheck, Calendar, Video, Quote } from 'lucide-react';
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
      bio: 'Sinh viên năm 4 K18, đạt giải nghiên cứu khoa học. Chuyên hỗ trợ các bạn làm đồ án AI, xây dựng mô hình Machine Learning từ cơ bản đến nâng cao.'
    },
    {
      name: 'Lê Minh Hương',
      role: 'Mentor Fullstack',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
      skills: ['React', 'Node.js', 'MongoDB'],
      rating: 4.8,
      reviews: 8,
      bio: 'Chuyên về web app, có 1 năm kinh nghiệm làm freelancer. Sẵn sàng hỗ trợ các bạn từ thiết kế API đến triển khai ứng dụng thực tế.'
    },
    {
      name: 'Phạm Thùy Linh',
      role: 'Mentor Digital Marketing',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linh',
      skills: ['SEO', 'Google Ads', 'Figma'],
      rating: 4.9,
      reviews: 5,
      bio: 'Có kinh nghiệm chạy chiến dịch marketing thực tế. Hỗ trợ các bạn xây dựng chiến lược nội dung, tối ưu SEO và thiết kế giao diện với Figma.'
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

      {/* Hero Section — mobile: nền gradient (ẩn ảnh vì chỉ khớp desktop); desktop (lg+): giữ ảnh illustration như cũ */}
      <section className="relative overflow-hidden text-white py-20 sm:py-24 lg:py-36 text-left bg-gradient-to-br from-brand-primary via-brand-primary to-[#051138] lg:bg-[url('/hero-illustration.jpg')] lg:bg-cover lg:bg-right">
        {/* Hoạ tiết chấm mờ chỉ hiện trên mobile (desktop đã có ảnh nền) */}
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none lg:hidden"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content Left */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-meta font-extrabold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md shadow-brand-primary/25 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Kết nối tri thức, nâng tầm tương lai
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight">
              <span className="text-white">Kết nối,</span> <span className="text-brand-secondary">Học hỏi</span><span className="text-white">,</span><br />
              <span className="text-brand-secondary">Chia sẻ</span><span className="text-white">,</span> <span className="text-white">Phát triển.</span>
            </h1>

            <div className="space-y-4">
              <p className="text-slate-100 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
                SkillSwap là nền tảng kết nối <strong className="text-white font-extrabold">Alumni (Cựu sinh viên)</strong> và <strong className="text-white font-extrabold">Sinh viên FPT University</strong>. Chia sẻ kiến thức và kinh nghiệm thực tế với giá trị cao.
              </p>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl max-w-2xl text-base text-slate-200 font-medium space-y-3 backdrop-blur-xs">
                <p className="text-lg font-bold text-brand-secondary flex items-center gap-2">
                  <span></span> DÀNH CHO AI &amp; LỢI ÍCH GÌ?
                </p>
                <div className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                  <span className="text-slate-200 text-base leading-relaxed">
                    <strong className="text-white font-extrabold">Sinh viên (Mentee):</strong> Được hỗ trợ đồ án, ôn thi, sửa CV và chia sẻ kinh nghiệm phỏng vấn thực tế.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                  <span className="text-slate-200 text-base leading-relaxed">
                    <strong className="text-white font-extrabold">Cựu sinh viên (Mentor):</strong> Chia sẻ chuyên môn, xây dựng uy tín cá nhân và kết nối nhân tài tiềm năng cho doanh nghiệp.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to={isAuthenticated ? "/mentors" : "/login"}
                className="flex items-center gap-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white text-body font-bold py-3.5 px-7 rounded-full shadow-lg shadow-brand-primary/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Tìm mentor ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={isAuthenticated ? "/profile" : "/login"}
                className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white text-body font-bold py-3.5 px-7 rounded-full active:scale-95 transition-all backdrop-blur-xs"
              >
                Trở thành Mentor
              </Link>
            </div>
          </div>

          {/* empty right col — image is bg */}
          <div className="hidden lg:block" />
        </div>
      </section>

      {/* Stats Counter Section */}
      <section id="stats" className="py-12 bg-surface border-b border-line-soft">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5 hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-brand-primary block">500+</span>
              <span className="text-meta font-extrabold text-fg-muted uppercase tracking-wider block">Mentor hoạt động</span>
            </div>

            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5 hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-brand-primary block">10,000+</span>
              <span className="text-meta font-extrabold text-fg-muted uppercase tracking-wider block">Phiên học hoàn thành</span>
            </div>

            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5 hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-brand-primary block">95%</span>
              <span className="text-meta font-extrabold text-fg-muted uppercase tracking-wider block">Tỷ lệ hài lòng</span>
            </div>

            <div className="bg-surface border border-line rounded-card p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5 hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-brand-primary block">80+</span>
              <span className="text-meta font-extrabold text-fg-muted uppercase tracking-wider block">Chủ đề chuyên môn</span>
            </div>

          </div>
        </div>
      </section>

      {/* About Platform Mechanism */}
      <section id="about" className="py-20 bg-surface-muted/50 text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div className="space-y-6">
            <span className="inline-block text-meta font-extrabold text-brand-primary bg-primary-soft/80 border border-primary/20 py-1 px-3.5 rounded-full uppercase tracking-wider shadow-[0_1px_2px_rgba(0,56,224,0.02)]">
              Quy trình dẫn dắt trải nghiệm
            </span>
            <h2 className="text-3xl font-bold text-fg tracking-tight leading-tight">
              5 bước đồng hành dễ dàng cùng SkillSwap
            </h2>
            <p className="text-fg-muted text-body font-semibold leading-relaxed">
              Từ lúc tham gia đến khi kết thúc buổi học, chúng tôi tối ưu quy trình để bạn có trải nghiệm kết nối chuyên nghiệp nhất:
            </p>

            <div className="relative border-l border-line-soft pl-6 ml-4 space-y-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[38px] top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-body shadow-md">
                  1
                </div>
                <div>
                  <span className="text-body font-bold text-fg block flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-primary" /> Tìm kiếm Mentor phù hợp
                  </span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Sử dụng các bộ lọc chuyên sâu để tìm kiếm mentor theo ngành học, kỹ năng cụ thể (React, Figma, Python) hoặc dựa trên tỷ lệ gợi ý hợp gu (%) của hệ thống.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-[38px] top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-body shadow-md">
                  2
                </div>
                <div>
                  <span className="text-body font-bold text-fg block flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-primary" /> Xem thông tin &amp; Portfolio năng lực
                  </span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Xem hồ sơ chi tiết của mentor bao gồm: số năm kinh nghiệm, công ty đang làm việc, thành tích nổi bật và trực tiếp xem các dự án thực tế trong mục Portfolio của họ.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-[38px] top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-body shadow-md">
                  3
                </div>
                <div>
                  <span className="text-body font-bold text-fg block flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" /> Đặt lịch hẹn tiện lợi
                  </span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Chọn khung giờ rảnh tương ứng của mentor, điền ngắn gọn mục tiêu học tập (cần hỗ trợ đồ án, luyện thi, hay định hướng CV) và gửi yêu cầu kết nối.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="absolute -left-[38px] top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-body shadow-md">
                  4
                </div>
                <div>
                  <span className="text-body font-bold text-fg block flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-primary" /> Tham gia phiên học
                  </span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Khi lịch hẹn được duyệt, tham gia phòng học trực tuyến (Google Meet/Zoom) hoặc gặp trực tiếp để giải quyết thắc mắc học tập hoàn toàn miễn phí.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <div className="absolute -left-[38px] top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-body shadow-md">
                  5
                </div>
                <div>
                  <span className="text-body font-bold text-fg block flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-primary fill-primary" /> Phản hồi &amp; Đánh giá
                  </span>
                  <p className="text-meta text-fg-muted mt-1 font-semibold leading-relaxed">
                    Sau buổi học, hãy để lại điểm rating và đánh giá nhận xét. Ý kiến đóng góp của bạn giúp bảo vệ uy tín chuyên môn và chất lượng cộng đồng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mockups / Match Visual Demo */}
          <div className="space-y-6">
            <div className="w-full bg-surface border border-line p-6 rounded-card shadow-[0_1px_3px_rgba(15,23,42,0.02)] relative space-y-5">
              <div className="flex items-start sm:items-center justify-between gap-2 border-b border-line-soft pb-3">
                <span className="text-body font-bold text-fg flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-fg-muted animate-spin-slow shrink-0" /> Mô phỏng gợi ý mentor phù hợp
                </span>
                <span className="text-meta bg-green-50 text-green-700 font-extrabold border border-green-200 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">
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
                    <span className="text-meta text-brand-primary font-bold">Cần học: Python cơ bản & Machine Learning</span>
                  </div>
                </div>

                {/* Arrow Symbol */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-surface-muted border border-line flex items-center justify-center text-slate-705 shadow-2xs">
                    <span className="text-body font-extrabold">↓</span>
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
                    <span className="text-body font-bold block">Trần Hoàng Long — Mentor AI/ML (K18)</span>
                    <span className="text-meta text-green-600 font-bold">Chuyên môn: Python · PyTorch · SQL</span>
                  </div>
                </div>
              </div>

              {/* Match Rationale text */}
              <div className="bg-surface-muted border border-slate-155 p-4 rounded-card text-meta text-fg-muted font-semibold space-y-1.5 text-left leading-normal">
                <p className="text-fg font-extrabold flex items-center gap-1 uppercase tracking-wider text-[8px] border-b border-line pb-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0 text-fg" /> Lý do đề xuất hệ thống
                </p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-fg-muted shrink-0 mt-0.5" /> <span>Chuyên môn của Long khớp với nhu cầu học Python của bạn.</span></p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-fg-muted shrink-0 mt-0.5" /> <span>Long có 12 đánh giá tích cực từ học viên trước.</span></p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-fg-muted shrink-0 mt-0.5" /> <span>Cùng cơ sở TP. Hồ Chí Minh, dễ dàng sắp xếp lịch học.</span></p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Student Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-surface-muted/50 to-surface border-t border-b border-line-soft text-left">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="inline-block text-meta font-extrabold text-brand-primary bg-primary-soft/80 border border-primary/20 py-1 px-3.5 rounded-full uppercase tracking-wider shadow-[0_1px_2px_rgba(0,56,224,0.02)]">
              Câu chuyện thành công
            </span>
            <h2 className="text-3xl font-bold text-fg tracking-tight">Học viên nói gì về SkillSwap?</h2>
            <p className="text-fg-muted text-body font-semibold">
              Hàng ngàn sinh viên FPTU đã vượt qua các môn học khó và đạt được mục tiêu học tập nhờ sự đồng hành của các Mentor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-surface border border-line p-8 rounded-card shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <Quote className="absolute right-6 top-6 w-10 h-10 text-slate-200/50 pointer-events-none" />
              <p className="text-body text-fg-muted leading-relaxed font-semibold italic">
                "Nhờ anh Long (K18) hướng dẫn làm đồ án tốt nghiệp React Native + AI, nhóm mình đã đạt loại Xuất sắc. Anh chỉ bảo tận tình từ kiến trúc API đến cách tối ưu hóa UX."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=student1"
                  alt="Student A"
                  className="w-10 h-10 rounded-full border border-line"
                />
                <div>
                  <span className="text-body font-bold text-fg block">Nguyễn Văn An</span>
                  <span className="text-meta text-fg-faint font-extrabold">Sinh viên K18 — Kỹ thuật Phần mềm</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-surface border border-line p-8 rounded-card shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <Quote className="absolute right-6 top-6 w-10 h-10 text-slate-200/50 pointer-events-none" />
              <p className="text-body text-fg-muted leading-relaxed font-semibold italic">
                "Mình học trái ngành qua Thiết kế đồ họa và rất bối rối. May mắn gặp chị Linh (Alumni) hướng dẫn hoàn thiện portfolio Behance và Figma, nhờ đó mình đã đậu thực tập UI/UX Designer tại VNG."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=student2"
                  alt="Student B"
                  className="w-10 h-10 rounded-full border border-line"
                />
                <div>
                  <span className="text-body font-bold text-fg block">Trần Thị Bích</span>
                  <span className="text-meta text-fg-faint font-extrabold">Sinh viên K19 — Thiết kế Đồ họa</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-surface border border-line p-8 rounded-card shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <Quote className="absolute right-6 top-6 w-10 h-10 text-slate-200/50 pointer-events-none" />
              <p className="text-body text-fg-muted leading-relaxed font-semibold italic">
                "Cổng kết nối SkillSwap rất tuyệt vời. Mình đã đặt lịch gặp các cựu sinh viên đi làm tại các tập đoàn lớn để nhờ sửa CV và nhận lộ trình học tập, tiết kiệm thời gian định hướng rất nhiều."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=student3"
                  alt="Student C"
                  className="w-10 h-10 rounded-full border border-line"
                />
                <div>
                  <span className="text-body font-bold text-fg block">Lê Hoàng Nam</span>
                  <span className="text-meta text-fg-faint font-extrabold">Sinh viên K18 — Quản trị Kinh doanh</span>
                </div>
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
              SkillSwap xây dựng hai vai trò rõ ràng, hỗ trợ toàn bộ hành trình từ tìm mentor đến hoàn thành buổi học.
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
                    <Smile className="w-4 h-4 shrink-0" /> Đang nhận học viên
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
            Đăng nhập ngay để tìm mentor phù hợp, đặt lịch học và phát triển bản thân cùng cộng đồng sinh viên.
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
              Nền tảng kết nối sinh viên với mentor có chuyên môn, miễn phí dành cho sinh viên đại học.
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
              <li><a href="#features" className="hover:text-white transition-colors">Kết nối mentor</a></li>
              <li><a href="#mentors" className="hover:text-white transition-colors">Tìm mentor</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Lộ trình học tập</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-white font-bold block uppercase tracking-wider text-meta">Liên hệ & Hỗ trợ</span>
            <ul className="space-y-2 font-semibold">
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>091 157 12 19</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:skillswapfptu@gmail.com" className="hover:text-white transition-colors">skillswapfptu@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <span>💬</span>
                <span>FPT SkillSwap Community</span>
              </li>
              <li><a href="/terms" className="hover:text-white transition-colors">Nội quy & Điều khoản</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 text-center text-meta text-fg-muted font-semibold">
          © {new Date().getFullYear()} SkillSwap. Dự án học tập thực chiến EXE101. Bảo lưu mọi quyền.
        </div>
      </footer>

    </div>
  );
};
