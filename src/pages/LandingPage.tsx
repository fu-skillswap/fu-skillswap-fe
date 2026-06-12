import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Star, Check, Compass, Sparkles, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

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
    <div className="min-h-screen bg-slate-50 text-[#0f172a] font-sans selection:bg-slate-900 selection:text-white">
      
      {/* Public Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <span className="text-slate-400 font-extrabold">///</span> SkillSwap
            </span>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-500">
            <a href="#about" className="hover:text-slate-900 transition-colors">Về chúng tôi</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Tính năng chính</a>
            <a href="#mentors" className="hover:text-slate-900 transition-colors">Mentor tiêu biểu</a>
            <a href="#stats" className="hover:text-slate-900 transition-colors">Số liệu thống kê</a>
          </nav>

          {/* CTA Button */}
          <div>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-5.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Vào Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-5.5 rounded-full transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Đăng nhập ngay
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Full Image Background */}
      <section 
        className="relative overflow-hidden text-white py-28 lg:py-36 text-left bg-cover bg-center"
        style={{ backgroundImage: "url('/fpt-banner.png')" }}
      >
        {/* Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/75 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Hero Content Left */}
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-[#f58220] text-white text-[10px] font-extrabold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md shadow-[#f58220]/25 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Cộng đồng trao đổi kỹ năng FPTU
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight">
              Kiến thức của bạn,<br />
              <span className="text-[#f58220]">Kỹ năng</span> của bạn học
            </h1>
            
            <p className="text-slate-200 text-xs sm:text-sm font-semibold max-w-xl leading-relaxed">
              SkillSwap là nền tảng trao đổi kỹ năng chéo học thuật độc quyền cho sinh viên FPT University. 
              Bạn chia sẻ thế mạnh lập trình, đổi lấy sự trợ giúp về thiết kế UI/UX hay ngoại ngữ từ bạn cùng trường.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-[#f58220] hover:bg-[#e07216] text-white text-xs font-bold py-3.5 px-7 rounded-full shadow-lg shadow-[#f58220]/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Bắt đầu trao đổi ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-3.5 px-7 rounded-full active:scale-95 transition-all backdrop-blur-xs"
              >
                Tìm hiểu cơ chế
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section id="stats" className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-slate-900 block">1,200+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giờ học trao đổi</span>
            </div>

            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-slate-900 block">450+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thành viên FPTU</span>
            </div>

            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-slate-900 block">80+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mentor được duyệt</span>
            </div>

            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] text-center space-y-1.5">
              <span className="text-3xl font-bold text-slate-900 block">4.85 / 5</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Điểm hài lòng</span>
            </div>

          </div>
        </div>
      </section>

      {/* About Platform Mechanism */}
      <section id="about" className="py-20 bg-slate-50/50 text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6">
            <span className="inline-block text-[9px] font-extrabold text-slate-755 bg-slate-100 border border-slate-200 py-1 px-3.5 rounded-full uppercase tracking-wider">
              Cơ chế vận hành
            </span>
            <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight leading-tight">
              Mô hình Trao đổi Kỹ năng Chéo hoạt động như thế nào?
            </h2>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              SkillSwap loại bỏ rào cản chi phí trong gia sư học thuật bằng việc thiết lập vòng lặp chia sẻ kiến thức công bằng:
            </p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold">1</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Khai báo hồ sơ kỹ năng</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                    Bạn cập nhật các kỹ năng bản thân đã thành thạo (được chứng thực qua môn học) và các kỹ năng bạn mong muốn học tập.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Ghép cặp thông minh</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                    Thuật toán tự động quét dữ liệu và đề xuất các bạn cùng trường có nhu cầu trao đổi đối ứng (Kỹ năng có ⇄ Kỹ năng cần) phù hợp nhất với bạn.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Gặp mặt trực tuyến & Trao đổi chéo</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                    Mentor duyệt lịch hẹn, cung cấp phòng Google Meet/Zoom trực tiếp và hai bên tiến hành dạy - học lẫn nhau hoàn toàn miễn phí.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mockups / Match Visual Demo */}
          <div className="space-y-6">
            <div className="w-full bg-white border border-slate-200/80 p-6 rounded-3xl shadow-[0_1px_3px_rgba(15,23,42,0.02)] relative space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-slate-600 animate-spin-slow" /> Mô phỏng thuật toán ghép cặp
                </span>
                <span className="text-[9px] bg-green-50 text-green-700 font-extrabold border border-green-200 px-2 py-0.5 rounded-lg">
                  98% Tương hợp
                </span>
              </div>

              {/* Match Visualization Demo */}
              <div className="space-y-4">
                {/* Mentee (You) */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=mentee"
                    alt="Mentee"
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold block">Bạn (Sinh viên K19)</span>
                    <span className="text-[9px] text-[#f58220] font-bold">Thế mạnh: Figma UI/UX ⇄ Cần học: Python</span>
                  </div>
                </div>

                {/* Exchange Symbol */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-705 shadow-2xs">
                    <span className="text-xs font-extrabold">⇄</span>
                  </div>
                </div>

                {/* Mentor */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=long"
                    alt="Mentor"
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold block">Trần Hoàng Long (Sinh viên K18)</span>
                    <span className="text-[9px] text-green-600 font-bold">Thế mạnh: Python ⇄ Cần học: Figma</span>
                  </div>
                </div>
              </div>

              {/* Match Rationale text */}
              <div className="bg-slate-50 border border-slate-155 p-4 rounded-2xl text-[10px] text-slate-500 font-semibold space-y-1.5 text-left leading-normal">
                <p className="text-slate-800 font-extrabold flex items-center gap-1 uppercase tracking-wider text-[8px] border-b border-slate-200/60 pb-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0 text-slate-800" /> Lý do đề xuất hệ thống
                </p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" /> <span>Bạn sở hữu kỹ năng Figma Long đang tìm kiếm.</span></p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" /> <span>Long sẵn sàng chia sẻ kỹ năng Python bạn đang cần.</span></p>
                <p className="flex items-start gap-1"><Check className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" /> <span>Hai bạn cùng học tập tại Cơ sở TP. Hồ Chí Minh.</span></p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Core Features Grid */}
      <section id="features" className="py-20 bg-white border-t border-slate-100 text-left">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="inline-block text-[9px] font-extrabold text-slate-700 bg-slate-100 border border-slate-200 py-1 px-3.5 rounded-full uppercase tracking-wider">
              Môi trường phân quyền
            </span>
            <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight">Trải nghiệm phân vai trò tương tác</h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
              SkillSwap xây dựng ba vai trò tương thích hoàn chỉnh, mô phỏng chính xác các hoạt động kiểm duyệt và kết nối tại FPT University.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            
            {/* Mentee card */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl hover:border-slate-400 hover:shadow-xs transition-all space-y-4">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Dành cho Mentee (Học viên)</h3>
              <ul className="space-y-2.5 text-xs text-slate-500 font-semibold">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Tìm kiếm, lọc danh sách Mentor theo ngành.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Xem độ tương hợp (%) và đánh giá lịch sử.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Nộp đơn xin lên làm Mentor (kèm tài liệu).</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Báo cáo kết quả và viết phản hồi công khai.</span></li>
              </ul>
            </div>

            {/* Mentor card */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl hover:border-slate-400 hover:shadow-xs transition-all space-y-4">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Dành cho Mentor (Người dạy)</h3>
              <ul className="space-y-2.5 text-xs text-slate-500 font-semibold">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Tạo lịch rảnh (Slots) theo ngày và giờ hẹn.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Chấp nhận hoặc từ chối lịch kèm lý do.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Cập nhật link phòng trực tuyến (Zoom/Meet).</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Cấu hình portfolio, kinh nghiệm & dịch vụ.</span></li>
              </ul>
            </div>

            {/* Admin card */}
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl hover:border-slate-400 hover:shadow-xs transition-all space-y-4">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Dành cho Admin (Quản trị)</h3>
              <ul className="space-y-2.5 text-xs text-slate-500 font-semibold">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Xem dashboard báo cáo chỉ số MVP vận hành.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Quản lý khóa/mở hoạt động của tài khoản.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Phê duyệt hàng chờ chứng chỉ xin lên Mentor.</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" /> <span>Giám sát hệ thống logs đăng ký & đặt chỗ.</span></li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Top Mentors spotlight */}
      <section id="mentors" className="py-20 bg-slate-50 text-left">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-2">
              <span className="inline-block text-[9px] font-extrabold text-slate-700 bg-slate-100 border border-slate-200 py-1 px-3.5 rounded-full uppercase tracking-wider">
                Đội ngũ tinh hoa
              </span>
              <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight">Mentor tiêu biểu xuất sắc</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                Các sinh viên khóa trên đạt kết quả GPA cao và có nhiều kinh nghiệm dự án thực tế.
              </p>
            </div>
            
            <Link
              to="/login"
              className="text-xs font-bold text-slate-950 hover:text-slate-700 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Xem tất cả danh sách <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockTopMentors.map((m, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-5 flex flex-col justify-between hover:border-slate-400 hover:shadow-xs transition-all relative overflow-hidden group">
                <div className="space-y-4">
                  {/* Avatar & Info */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-11 h-11 rounded-xl bg-slate-50 object-cover border border-slate-200"
                    />
                    <div className="text-left space-y-0.5">
                      <span className="text-sm font-bold text-slate-900 block group-hover:text-slate-700 transition-colors">{m.name}</span>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{m.role}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs font-bold text-[#f58220]">
                    <Star className="w-3.5 h-3.5 fill-[#f58220]" /> {m.rating}{' '}
                    <span className="text-slate-400 text-[10px] font-semibold">({m.reviews} đánh giá)</span>
                  </div>

                  {/* Bio */}
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold line-clamp-3">
                    "{m.bio}"
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.skills.map((s, sIdx) => (
                      <span key={sIdx} className="text-[9px] bg-slate-50 border border-slate-200/85 text-slate-500 py-0.5 px-2 rounded-md font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="text-[10px] text-green-600 flex items-center gap-1 font-bold">
                    <Smile className="w-4 h-4 shrink-0" /> Sẵn sàng trao đổi
                  </span>
                  
                  <Link
                    to="/login"
                    className="text-slate-800 hover:text-slate-650 inline-flex items-center gap-1 cursor-pointer"
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
      <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 space-y-6 relative">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Nâng cao năng lực học tập và kết nối hôm nay!
          </h2>
          <p className="text-slate-400 text-xs font-semibold max-w-md mx-auto leading-relaxed">
            Đăng nhập ngay bằng Chế độ Bypass để trải nghiệm các vai trò, đặt lịch học và trao đổi kiến thức học thuật tại FPT University.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-[#f58220] hover:bg-[#e07216] text-white text-xs font-extrabold py-3.5 px-8 rounded-full shadow-xl shadow-[#f58220]/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>Truy cập hệ thống ngay</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="bg-[#0b172a] text-slate-400 py-12 text-left text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="text-slate-500 font-extrabold">///</span> SkillSwap
              </span>
            </div>
            <p className="leading-relaxed font-semibold">
              Cộng đồng trao đổi kỹ năng học thuật miễn phí dành riêng cho sinh viên FPT University.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-white font-bold block uppercase tracking-wider text-[10px]">Tài nguyên</span>
            <ul className="space-y-2 font-semibold">
              <li><a href="#about" className="hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Tính năng chính</a></li>
              <li><a href="#mentors" className="hover:text-white transition-colors">Đội ngũ Mentor</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-white font-bold block uppercase tracking-wider text-[10px]">Định hướng học tập</span>
            <ul className="space-y-2 font-semibold">
              <li><a href="https://fpt.edu.vn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Đại học FPT HCM</a></li>
              <li><a href="https://fpt.edu.vn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Đại học FPT Hà Nội</a></li>
              <li><a href="https://fpt.edu.vn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Đại học FPT Đà Nẵng</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-white font-bold block uppercase tracking-wider text-[10px]">Liên hệ & Hỗ trợ</span>
            <p className="leading-relaxed font-semibold">
              Phòng Công tác Sinh viên (SRO) - FPTU Campus Quận 9, TP. Hồ Chí Minh.<br />
              Email: sro.hcm@fpt.edu.vn
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 text-center text-[10px] text-slate-500 font-semibold">
          © {new Date().getFullYear()} SkillSwap FPT. Dự án học tập thực chiến EXE101. Bảo lưu mọi quyền.
        </div>
      </footer>

    </div>
  );
};
