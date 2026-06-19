import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, MessageSquare, Sparkles, BookOpen, Send, Calendar,
  Heart, Share2, Image as ImageIcon, X, MoreHorizontal, Globe,
  ChevronLeft, ChevronRight, MessageCircle, ChevronUp, ChevronDown,
} from 'lucide-react';

interface RecommendedMentor {
  id: string; name: string; avatarUrl: string; major: string;
  specialization: string; skills: string[]; matchScore: number; bio: string;
}

interface FeedPost {
  id: string; authorName: string; authorAvatar: string; authorRole: string;
  timeAgo: string; content: string; skills: string[];
  likesCount: number; commentsCount: number; hasLiked?: boolean; mentorId?: string;
}

export const Dashboard: React.FC = () => {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<RecommendedMentor[]>([]);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: 'p1', authorName: 'Trần Hoàng Long',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
      authorRole: 'Mentor AI/ML (K18)', timeAgo: '2 giờ trước',
      content: 'Chào các bạn K19, tối nay mình có mở slot rảnh học 1-1 về PyTorch cơ bản lúc 20:00. Bạn nào đang làm Lab 2 mà gặp lỗi kẹt ở bước train model thì đặt lịch hẹn qua profile mình nhé!',
      skills: ['Python', 'PyTorch', 'Deep Learning'],
      likesCount: 15, commentsCount: 3, hasLiked: false, mentorId: 'm1',
    },
    {
      id: 'p2', authorName: 'Lê Minh Hương',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
      authorRole: 'Mentor Fullstack (K18)', timeAgo: '5 giờ trước',
      content: 'Mình vừa viết xong repo React Context API mẫu để gỡ lỗi re-render vô hạn thường gặp trong môn PRN221. Các bạn có thể clone ở GitHub của mình hoặc inbox mình để trao đổi.',
      skills: ['React', 'Context API', 'State Management'],
      likesCount: 28, commentsCount: 7, hasLiked: true,
    },
    {
      id: 'p3', authorName: 'Nguyễn Hoàng Nam',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
      authorRole: 'Mentee Thiết kế Mỹ thuật số', timeAgo: '1 ngày trước',
      content: 'Tìm bạn học chéo: Mình đang làm đồ án UI/UX Figma và muốn học kèm HTML/CSS/JS cơ bản để tự code portfolio. Bạn nào giỏi Front-end muốn học Auto Layout Figma nâng cao thì kết nối với mình nha!',
      skills: ['Figma UI', 'Figma Auto Layout', 'HTML/CSS'],
      likesCount: 9, commentsCount: 2, hasLiked: false,
    },
  ]);

  const [composerText, setComposerText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('for-you');

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeMentor, setActiveMentor] = useState<RecommendedMentor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const stepperScrollRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const [chatsOpen, setChatsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMentors([
        { id: 'm1', name: 'Trần Hoàng Long', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long', major: 'Kỹ thuật phần mềm', specialization: 'Trí tuệ nhân tạo', skills: ['Python', 'PyTorch', 'Machine Learning', 'SQL'], matchScore: 98, bio: 'Sinh viên năm 4 K18, đạt giải nghiên cứu khoa học cấp trường.' },
        { id: 'm2', name: 'Lê Minh Hương', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong', major: 'Kỹ thuật phần mềm', specialization: 'Lập trình Fullstack', skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'], matchScore: 92, bio: 'Chuyên về web app, 1 năm kinh nghiệm freelancer.' },
        { id: 'm3', name: 'Nguyễn Tiến Đạt', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat', major: 'An toàn thông tin', specialization: 'An ninh mạng', skills: ['Linux', 'Network Pentesting', 'Docker'], matchScore: 85, bio: 'Đam mê hacking và an ninh hệ thống.' },
      ]);
      setLoading(false);
    }, 400);

    const handleFocusComposer = () => {
      if (composerInputRef.current) composerInputRef.current.focus();
    };
    window.addEventListener('open-post-composer', handleFocusComposer);
    return () => { clearTimeout(timer); window.removeEventListener('open-post-composer', handleFocusComposer); };
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;
    const newPost: FeedPost = {
      id: `p_custom_${Date.now()}`,
      authorName: user?.fullName || 'Demo User',
      authorAvatar: user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      authorRole: (activeRole || user?.roles?.[0]) === 'MENTOR' ? 'Mentor học thuật' : 'Sinh viên (Mentee)',
      timeAgo: 'Vừa xong', content: composerText, skills: ['Thảo luận chéo'],
      likesCount: 0, commentsCount: 0, hasLiked: false,
    };
    setPosts([newPost, ...posts]);
    setComposerText('');
    setSuccessMsg('Đăng tin lên bảng tin cộng đồng thành công!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleLikePost = (postId: string) => {
    setPosts(posts.map((p) => {
      if (p.id === postId) {
        const hasLiked = !p.hasLiked;
        return { ...p, hasLiked, likesCount: hasLiked ? p.likesCount + 1 : p.likesCount - 1 };
      }
      return p;
    }));
  };

  const handleOpenBooking = (mentorId: string) => {
    const found = mentors.find((m) => m.id === mentorId);
    if (found) { setActiveMentor(found); setShowBookingModal(true); setBookingSuccess(false); }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBookingSuccess(true);
      const str = localStorage.getItem('mockMenteeBookings');
      let current = [];
      if (str) { try { current = JSON.parse(str); } catch { current = []; } }
      if (activeMentor) {
        current.unshift({
          id: 'b_custom_' + Date.now(), mentorName: activeMentor.name, avatarUrl: activeMentor.avatarUrl,
          skill: activeMentor.specialization, date: bookingDate, time: bookingTime,
          status: 'PENDING' as const, learningGoal: bookingMessage,
        });
        localStorage.setItem('mockMenteeBookings', JSON.stringify(current));
      }
      setTimeout(() => {
        setShowBookingModal(false); setBookingDate(''); setBookingTime(''); setBookingMessage('');
      }, 1500);
    }, 800);
  };

  const scrollChecklist = (direction: 'left' | 'right') => {
    if (stepperScrollRef.current) {
      const { scrollLeft } = stepperScrollRef.current;
      stepperScrollRef.current.scrollTo({ left: direction === 'left' ? scrollLeft - 290 : scrollLeft + 290, behavior: 'smooth' });
    }
  };

  const steps = [
    { icon: <BookOpen className="w-5 h-5" />, title: 'Bạn có chuyên môn học thuật?', desc: 'Cấu hình hồ sơ chuyên môn và giảng dạy để kết nối trao đổi chéo.', to: '/profile', cta: 'Bắt đầu ngay' },
    { icon: <Sparkles className="w-5 h-5" />, title: 'Tìm kiếm đề xuất phù hợp', desc: 'Xem danh mục Mentor rảnh trong campus được đề xuất riêng cho bạn.', to: '/mentors', cta: 'Khám phá' },
    { icon: <Calendar className="w-5 h-5" />, title: 'Quản lý lịch hẹn học chéo', desc: 'Theo dõi yêu cầu rảnh và phê duyệt lịch hẹn từ bạn học ở Dashboard.', to: '/mentee/bookings', cta: 'Xem lịch hẹn' },
  ];

  const tabLabels: Record<string, string> = {
    'for-you': 'Dành cho bạn', recent: 'Mới nhất', nearby: 'Cùng cơ sở', trending: 'Thịnh hành',
  };

  return (
    <div className="space-y-6 text-left relative">
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-start gap-3 bg-success/10 border border-success/30 text-success p-4 rounded-field text-body font-semibold shadow-lg animate-slideIn">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ===== Feed column ===== */}
        <div className="lg:col-span-2 space-y-5">
          {/* Composer */}
          <div className="ss-card rounded-card p-4 flex items-center gap-3.5">
            {user && <img src={user.avatarUrl} alt={user.fullName} className="w-11 h-11 rounded-full object-cover shrink-0" />}
            <div className="flex-1 bg-surface-muted rounded-pill py-3 px-5 flex items-center">
              <input
                type="text" value={composerText} ref={composerInputRef}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Có chuyện gì thế? Chia sẻ tin học tập..."
                className="bg-transparent border-none outline-none flex-1 text-body text-fg placeholder-fg-muted"
              />
            </div>
            <button type="button" onClick={() => alert('Chức năng đính kèm hình ảnh (Mockup)')} title="Đính kèm ảnh"
              className="p-3 bg-surface-muted hover:opacity-80 text-fg-muted rounded-field transition-all shrink-0">
              <ImageIcon className="w-5 h-5" />
            </button>
            <button onClick={handleCreatePost}
              className="bg-action hover:bg-action-hover text-on-action rounded-field px-6 py-3 text-body font-bold transition-all active:scale-95 cursor-pointer shrink-0">
              Đăng tin
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {Object.keys(tabLabels).map((tabId) => {
              const isActive = activeTab === tabId;
              return (
                <button key={tabId} onClick={() => setActiveTab(tabId)}
                  className={`px-5 py-2 rounded-pill text-body font-bold transition-all shrink-0 cursor-pointer ${
                    isActive ? 'bg-action text-on-action' : 'bg-surface border border-line text-fg-muted hover:text-fg'
                  }`}>
                  {tabLabels[tabId]}
                </button>
              );
            })}
          </div>

          {/* Stepper checklist */}
          <div className="ss-card rounded-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-title font-extrabold text-fg">Bắt đầu cùng SkillSwap</h3>
              <div className="flex items-center gap-1.5">
                <button onClick={() => scrollChecklist('left')} className="p-1.5 rounded-full border border-line bg-surface hover:bg-surface-muted text-fg-muted cursor-pointer transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollChecklist('right')} className="p-1.5 rounded-full border border-line bg-surface hover:bg-surface-muted text-fg-muted cursor-pointer transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-fg-faint hover:text-fg-muted ml-0.5"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
            </div>

            <div ref={stepperScrollRef} className="flex gap-4 overflow-x-auto scrollbar-none pb-2 snap-x">
              {steps.map((s, i) => (
                <div key={i} className="min-w-[270px] md:min-w-[290px] bg-surface-muted border border-line-soft rounded-field p-4 flex gap-3.5 text-left snap-start shrink-0">
                  <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center shrink-0 text-fg-muted">{s.icon}</div>
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h4 className="text-body font-bold text-fg leading-snug">{s.title}</h4>
                      <p className="text-meta text-fg-muted font-medium leading-relaxed">{s.desc}</p>
                    </div>
                    <Link to={s.to} className="inline-block bg-action hover:bg-action-hover text-on-action text-meta font-bold py-2 px-4 rounded-pill text-center active:scale-95 transition-all self-start">
                      {s.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 space-y-2 border-t border-line-soft">
              <div className="flex justify-between items-center text-meta font-bold text-fg-muted">
                <span>Đã hoàn thành 3 trên 7 bước</span>
              </div>
              <div className="w-full h-1.5 bg-surface-muted rounded-pill overflow-hidden">
                <div className="h-full bg-primary rounded-pill transition-all" style={{ width: '42.8%' }}></div>
              </div>
            </div>
          </div>

          {/* Feed list */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="ss-card rounded-card p-5 space-y-3.5 relative">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} alt={post.authorName} className="w-11 h-11 rounded-full object-cover border border-line" />
                    <div>
                      <span className="text-body font-bold text-fg block leading-tight">{post.authorName}</span>
                      <div className="flex items-center gap-1.5 mt-1 text-meta text-fg-faint font-bold uppercase tracking-wider">
                        <span>{post.authorRole}</span><span>•</span><span>{post.timeAgo}</span><span>•</span>
                        <Globe className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  <button className="p-1.5 text-fg-faint hover:text-fg-muted rounded-full hover:bg-surface-muted"><MoreHorizontal className="w-5 h-5" /></button>
                </div>

                <p className="text-body text-fg font-medium leading-relaxed whitespace-pre-line">{post.content}</p>

                <div className="flex flex-wrap gap-1.5">
                  {post.skills.map((s, idx) => (
                    <span key={idx} className="text-meta bg-surface-muted border border-line text-fg-muted py-1 px-2.5 rounded-md font-bold">{s}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-line-soft">
                  <div className="flex gap-2.5">
                    <button onClick={() => handleLikePost(post.id)}
                      className={`py-2 px-4 rounded-pill text-body font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                        post.hasLiked ? 'bg-danger/10 text-danger border-danger/20' : 'bg-surface hover:bg-surface-muted text-fg-muted border-line'
                      }`}>
                      <Heart className={`w-4.5 h-4.5 ${post.hasLiked ? 'fill-current' : ''}`} />
                      <span>{post.likesCount}</span>
                    </button>
                    <button className="py-2 px-4 bg-surface hover:bg-surface-muted border border-line rounded-pill text-body font-bold text-fg-muted cursor-pointer transition-all flex items-center gap-2">
                      <MessageSquare className="w-4.5 h-4.5" /><span>{post.commentsCount}</span>
                    </button>
                  </div>

                  {post.mentorId ? (
                    <button onClick={() => handleOpenBooking(post.mentorId!)}
                      className="flex items-center gap-2 bg-primary-soft hover:opacity-80 text-primary text-meta font-bold py-2 px-4 rounded-pill border border-primary/20 transition-all cursor-pointer">
                      <Calendar className="w-4 h-4" /><span>Đặt lịch Mentor</span>
                    </button>
                  ) : (
                    <button className="p-2.5 bg-surface hover:bg-surface-muted text-fg-muted rounded-full border border-line cursor-pointer transition-all">
                      <Share2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Widgets column ===== */}
        <div className="lg:col-span-1 space-y-5">
          {/* Campus widget */}
          <div className="ss-card rounded-card p-5 space-y-4">
            <div className="flex gap-3.5 items-center">
              <div className="w-12 h-12 rounded-full border border-line flex items-center justify-center bg-surface-muted relative shrink-0">
                <div className="w-7 h-7 rounded-full border border-line flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                </div>
              </div>
              <div className="text-left">
                <h4 className="text-body font-bold text-fg block leading-tight">Cơ sở TP. Hồ Chí Minh</h4>
                <span className="text-meta text-fg-faint font-semibold block mt-0.5">Quận 9, TP. HCM</span>
              </div>
            </div>
            <a href="#alerts" onClick={(e) => { e.preventDefault(); alert('Đang tải các thông báo quan trọng tại campus...'); }}
              className="w-full flex justify-between items-center pt-3 border-t border-line-soft text-body font-bold text-fg hover:text-primary group transition-colors">
              <span>Xem thông báo campus</span>
              <ChevronRight className="w-4.5 h-4.5 text-fg-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </a>
          </div>

          {/* Promo widget */}
          <div className="ss-card rounded-card p-5 space-y-4 flex flex-col">
            <img src="/exchange_illustration.png" alt="Study Exchange Illustration" className="w-full h-40 object-cover rounded-field border border-line-soft" />
            <div className="space-y-2 text-left">
              <h4 className="text-title font-extrabold text-fg leading-snug">Bạn có chuyên môn giảng dạy?</h4>
              <p className="text-meta text-fg-muted font-medium leading-relaxed">
                Đăng ký trở thành Mentor của dự án học tập SkillSwap. Báo cáo lịch dạy học chéo sẽ được duyệt tự động sang điểm rèn luyện campus.
              </p>
            </div>
            <Link to="/profile" className="w-full flex justify-between items-center pt-3 border-t border-line-soft text-body font-bold text-fg hover:text-primary group transition-colors">
              <span>Đăng ký Mentor ngay</span>
              <ChevronRight className="w-4.5 h-4.5 text-fg-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Profile overview */}
          <div className="ss-card rounded-card p-5 space-y-4">
            <h3 className="text-fg font-bold text-body border-b border-line-soft pb-3 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-fg-muted" /> Tóm tắt thông tin học viên
            </h3>
            <div className="space-y-3">
              {[
                ['MSSV', 'SE192621'], ['Ngành học', 'Kỹ thuật phần mềm'],
                ['Cơ sở FPT', 'FPT TP. HCM'], ['Học kỳ', 'Học kỳ 5'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-body">
                  <span className="text-fg-muted font-semibold">{k}</span>
                  <span className="font-bold text-fg">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-body">
                <span className="text-fg-muted font-semibold">Vai trò chính</span>
                <span className="bg-surface-muted text-fg-muted text-meta font-extrabold uppercase px-2.5 py-1 rounded-md border border-line">
                  {activeRole || user?.roles?.[0] || 'MENTEE'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-line-soft">
              <Link to="/profile" className="w-full flex items-center justify-center py-3 rounded-field bg-surface-muted hover:opacity-80 text-fg border border-line text-body font-bold transition-all">
                Cập nhật thông tin học tập
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Booking modal ===== */}
      {showBookingModal && activeMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md ss-card rounded-card p-6 relative shadow-2xl">
            <button onClick={() => setShowBookingModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-surface-muted hover:opacity-80 text-fg-muted transition-all cursor-pointer">
              <X className="w-4.5 h-4.5" />
            </button>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/30">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-fg font-bold text-head">Yêu cầu đã gửi thành công!</h3>
                <p className="text-fg-muted text-body font-medium px-4">Đề xuất trao đổi kỹ năng đã được chuyển tiếp tới {activeMentor.name}.</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="text-left border-b border-line-soft pb-3">
                  <h3 className="text-fg font-bold text-head">Đặt lịch với {activeMentor.name}</h3>
                  <p className="text-fg-muted text-body font-medium mt-1">Chọn khung thời gian và ghi rõ kỹ năng trao đổi chéo</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-muted border border-line rounded-field text-left">
                  <img src={activeMentor.avatarUrl} alt={activeMentor.name} className="w-11 h-11 rounded-full border border-line" />
                  <div>
                    <span className="text-body font-bold text-fg block">{activeMentor.name}</span>
                    <span className="text-meta text-primary font-extrabold uppercase mt-0.5 block">{activeMentor.specialization}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Ngày hẹn</label>
                    <input type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-surface-muted border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold" />
                  </div>
                  <div>
                    <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Giờ hẹn</label>
                    <input type="time" required value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-surface-muted border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 cursor-pointer font-semibold" />
                  </div>
                </div>

                <div>
                  <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Thỏa thuận trao đổi kỹ năng</label>
                  <textarea required rows={3} value={bookingMessage} onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Ví dụ: Mình hỗ trợ bạn cài đặt Linux/Docker, đổi lại bạn chỉ mình cơ bản về React Hook nhé?"
                    className="w-full bg-surface-muted border border-line rounded-field py-2.5 px-3 text-body text-fg focus:outline-none focus:border-primary/50 resize-none placeholder-fg-faint font-medium" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-action text-body font-bold py-3 px-4 rounded-field cursor-pointer transition-all active:scale-[0.98] mt-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    : <><Send className="w-4 h-4" /><span>Gửi lời mời học chéo</span></>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===== Floating chats drawer ===== */}
      <div className="fixed bottom-0 right-6 z-40 bg-surface border border-line shadow-2xl rounded-t-card w-72 transition-all">
        <button onClick={() => setChatsOpen(!chatsOpen)}
          className="w-full px-4 py-4 bg-surface border-b border-line-soft text-fg rounded-t-card flex items-center justify-between font-bold text-body select-none focus:outline-none cursor-pointer">
          <span>Trò chuyện trực tiếp</span>
          <div className="flex items-center gap-3 text-fg-muted">
            <MessageCircle className="w-5 h-5 text-primary" />
            {chatsOpen ? <ChevronDown className="w-4.5 h-4.5" /> : <ChevronUp className="w-4.5 h-4.5" />}
          </div>
        </button>

        {chatsOpen && (
          <div className="bg-surface max-h-80 overflow-y-auto divide-y divide-line-soft py-1 text-left animate-slideUp">
            {[
              { id: 'm1', name: 'Trần Hoàng Long', role: 'Mentor AI/ML', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long', online: true },
              { id: 'm2', name: 'Lê Minh Hương', role: 'Mentor Fullstack', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong', online: true },
              { id: 'm5', name: 'Nguyễn Hoàng Nam', role: 'Mentee Thiết kế', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam', online: false },
            ].map((c) => (
              <button key={c.id} onClick={() => navigate('/chat')}
                className="w-full p-3 flex gap-3 items-center hover:bg-surface-muted text-left transition-colors cursor-pointer">
                <div className="relative shrink-0">
                  <img src={c.avatar} className="w-10 h-10 rounded-full border border-line object-cover" />
                  {c.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-body font-bold text-fg block truncate">{c.name}</span>
                  <span className="text-meta text-fg-faint font-bold block">{c.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
