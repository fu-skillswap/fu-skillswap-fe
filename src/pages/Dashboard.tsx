import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  MessageSquare,
  Sparkles,
  BookOpen,
  Send,
  Calendar,
  Heart,
  Share2,
  Image as ImageIcon,
  X,
  MoreHorizontal,
  Globe,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface RecommendedMentor {
  id: string;
  name: string;
  avatarUrl: string;
  major: string;
  specialization: string;
  skills: string[];
  matchScore: number;
  bio: string;
}

interface FeedPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  timeAgo: string;
  content: string;
  skills: string[];
  likesCount: number;
  commentsCount: number;
  hasLiked?: boolean;
  mentorId?: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<RecommendedMentor[]>([]);
  const [loading, setLoading] = useState(true);

  // Feed state
  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: 'p1',
      authorName: 'Trần Hoàng Long',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
      authorRole: 'Mentor AI/ML (K18)',
      timeAgo: '2 giờ trước',
      content: 'Chào các bạn K19, tối nay mình có mở slot rảnh học 1-1 về PyTorch cơ bản lúc 20:00. Bạn nào đang làm Lab 2 mà gặp lỗi kẹt ở bước train model thì đặt lịch hẹn qua profile mình nhé!',
      skills: ['Python', 'PyTorch', 'Deep Learning'],
      likesCount: 15,
      commentsCount: 3,
      hasLiked: false,
      mentorId: 'm1'
    },
    {
      id: 'p2',
      authorName: 'Lê Minh Hương',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
      authorRole: 'Mentor Fullstack (K18)',
      timeAgo: '5 giờ trước',
      content: 'Mình vừa viết xong repo React Context API mẫu để gỡ lỗi re-render vô hạn thường gặp trong môn PRN221. Các bạn có thể clone ở GitHub của mình hoặc inbox mình để trao đổi.',
      skills: ['React', 'Context API', 'State Management'],
      likesCount: 28,
      commentsCount: 7,
      hasLiked: true
    },
    {
      id: 'p3',
      authorName: 'Nguyễn Hoàng Nam',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
      authorRole: 'Mentee Thiết kế Mỹ thuật số',
      timeAgo: '1 ngày trước',
      content: 'Tìm bạn học chéo: Mình đang làm đồ án UI/UX Figma và muốn học kèm HTML/CSS/JS cơ bản để tự code portfolio. Bạn nào giỏi Front-end muốn học Auto Layout Figma nâng cao thì kết nối với mình nha!',
      skills: ['Figma UI', 'Figma Auto Layout', 'HTML/CSS'],
      likesCount: 9,
      commentsCount: 2,
      hasLiked: false
    }
  ]);

  const [composerText, setComposerText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active filter tab
  const [activeTab, setActiveTab] = useState('for-you');

  // Booking Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeMentor, setActiveMentor] = useState<RecommendedMentor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Stepper checklist scroll ref
  const stepperScrollRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);

  // Chats Floating Drawer state
  const [chatsOpen, setChatsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMentors([
        {
          id: 'm1',
          name: 'Trần Hoàng Long',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
          major: 'Kỹ thuật phần mềm',
          specialization: 'Trí tuệ nhân tạo',
          skills: ['Python', 'PyTorch', 'Machine Learning', 'SQL'],
          matchScore: 98,
          bio: 'Sinh viên năm 4 K18, đạt giải nghiên cứu khoa học cấp trường. Sẵn sàng chia sẻ kiến thức AI/ML và muốn trao đổi thêm kỹ năng thiết kế UI/UX.',
        },
        {
          id: 'm2',
          name: 'Lê Minh Hương',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
          major: 'Kỹ thuật phần mềm',
          specialization: 'Lập trình Fullstack',
          skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
          matchScore: 92,
          bio: 'Chuyên về web app, có 1 năm kinh nghiệm làm freelancer. Muốn học hỏi thêm về DevOps và bảo mật mạng.',
        },
        {
          id: 'm3',
          name: 'Nguyễn Tiến Đạt',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
          major: 'An toàn thông tin',
          specialization: 'An ninh mạng',
          skills: ['Linux', 'Network Pentesting', 'Docker'],
          matchScore: 85,
          bio: 'Đam mê hacking và an ninh hệ thống. Muốn học lập trình React Native hoặc Flutter để làm app mobile.',
        },
      ]);
      setLoading(false);
    }, 400);

    // Sidebar Post event listener
    const handleFocusComposer = () => {
      if (composerInputRef.current) {
        composerInputRef.current.focus();
        composerInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('open-post-composer', handleFocusComposer);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-post-composer', handleFocusComposer);
    };
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;

    const newPost: FeedPost = {
      id: `p_custom_${Date.now()}`,
      authorName: user?.fullName || 'Demo User',
      authorAvatar: user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      authorRole: user?.roles?.[0] === 'MENTOR' ? 'Mentor học thuật' : 'Sinh viên (Mentee)',
      timeAgo: 'Vừa xong',
      content: composerText,
      skills: ['Thảo luận chéo'],
      likesCount: 0,
      commentsCount: 0,
      hasLiked: false
    };

    setPosts([newPost, ...posts]);
    setComposerText('');
    setSuccessMsg('Đăng tin lên bảng tin cộng đồng thành công!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          const hasLiked = !p.hasLiked;
          const likesCount = hasLiked ? p.likesCount + 1 : p.likesCount - 1;
          return { ...p, hasLiked, likesCount };
        }
        return p;
      })
    );
  };

  const handleOpenBooking = (mentorId: string) => {
    const foundMentor = mentors.find((m) => m.id === mentorId);
    if (foundMentor) {
      setActiveMentor(foundMentor);
      setShowBookingModal(true);
      setBookingSuccess(false);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBookingSuccess(true);
      
      const currentBookingsStr = localStorage.getItem('mockMenteeBookings');
      let currentBookings = [];
      if (currentBookingsStr) {
        try {
          currentBookings = JSON.parse(currentBookingsStr);
        } catch (err) {
          currentBookings = [];
        }
      }
      
      if (activeMentor) {
        const newMenteeBooking = {
          id: 'b_custom_' + Date.now(),
          mentorName: activeMentor.name,
          avatarUrl: activeMentor.avatarUrl,
          skill: activeMentor.specialization,
          date: bookingDate,
          time: bookingTime,
          status: 'PENDING' as const,
          learningGoal: bookingMessage,
        };
        currentBookings.unshift(newMenteeBooking);
        localStorage.setItem('mockMenteeBookings', JSON.stringify(currentBookings));
      }

      setTimeout(() => {
        setShowBookingModal(false);
        setBookingDate('');
        setBookingTime('');
        setBookingMessage('');
      }, 1500);
    }, 800);
  };

  const scrollChecklist = (direction: 'left' | 'right') => {
    if (stepperScrollRef.current) {
      const { scrollLeft } = stepperScrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 280 : scrollLeft + 280;
      stepperScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 text-left relative">
      
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-xs font-semibold shadow-lg animate-slideIn">
          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Responsive Grid: Feed Column (Left/Center) & Widgets Column (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Middle feed column */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Post Composer card matching Nearlist style */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4.5 flex items-center gap-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
            {user && (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            )}
            <div className="flex-1 bg-[#f1f5f9] rounded-full py-2 px-5 flex items-center gap-2.5">
              <input
                type="text"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                ref={composerInputRef}
                placeholder="Có chuyện gì thế? Chia sẻ tin học tập..."
                className="bg-transparent border-none outline-none flex-1 text-xs text-slate-800 placeholder-slate-500 focus:ring-0 focus:outline-none"
              />
            </div>
            <button 
              type="button"
              onClick={() => alert("Chức năng đính kèm hình ảnh (Mockup)")}
              className="p-2.5 bg-[#f1f5f9] hover:bg-slate-200/60 text-slate-600 rounded-full transition-all shrink-0"
              title="Đính kèm ảnh"
            >
              <ImageIcon className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleCreatePost}
              className="bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-full px-5.5 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            >
              Đăng tin
            </button>
          </div>

          {/* Filter Pills row */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['for-you', 'recent', 'nearby', 'trending'].map((tabId) => {
              const labelMap: Record<string, string> = {
                'for-you': 'Dành cho bạn',
                'recent': 'Mới nhất',
                'nearby': 'Cùng cơ sở',
                'trending': 'Thịnh hành'
              };
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`px-4.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#1e293b] text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {labelMap[tabId]}
                </button>
              );
            })}
          </div>

          {/* Stepper Checklist: Get Started on SkillSwap */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Bắt đầu cùng SkillSwap</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollChecklist('left')}
                  className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scrollChecklist('right')}
                  className="p-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 text-slate-400 hover:text-slate-600 ml-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Cards track */}
            <div
              ref={stepperScrollRef}
              className="flex gap-4.5 overflow-x-auto scrollbar-none pb-2 snap-x"
            >
              {/* Card 1 */}
              <div className="min-w-[260px] md:min-w-[280px] bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-left snap-start shrink-0">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">Bạn có chuyên môn học thuật?</h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Cấu hình hồ sơ chuyên môn và giảng dạy để kết nối trao đổi chéo.</p>
                  </div>
                  <Link
                    to="/profile"
                    className="inline-block bg-[#1e293b] hover:bg-[#0f172a] text-white text-[10px] font-bold py-1.5 px-3.5 rounded-full text-center active:scale-95 transition-all self-start"
                  >
                    Bắt đầu ngay
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="min-w-[260px] md:min-w-[280px] bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-left snap-start shrink-0">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">Tìm kiếm đề xuất phù hợp</h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Xem danh mục Mentor rảnh trong campus được đề xuất riêng cho bạn.</p>
                  </div>
                  <Link
                    to="/mentors"
                    className="inline-block bg-[#1e293b] hover:bg-[#0f172a] text-white text-[10px] font-bold py-1.5 px-3.5 rounded-full text-center active:scale-95 transition-all self-start"
                  >
                    Khám phá
                  </Link>
                </div>
              </div>

              {/* Card 3 */}
              <div className="min-w-[260px] md:min-w-[280px] bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-left snap-start shrink-0">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">Quản lý lịch hẹn học chéo</h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Theo dõi yêu cầu rảnh và phê duyệt lịch hẹn từ bạn học ở Dashboard.</p>
                  </div>
                  <Link
                    to="/mentee/bookings"
                    className="inline-block bg-[#1e293b] hover:bg-[#0f172a] text-white text-[10px] font-bold py-1.5 px-3.5 rounded-full text-center active:scale-95 transition-all self-start"
                  >
                    Xem lịch hẹn
                  </Link>
                </div>
              </div>
            </div>

            {/* Stepper Progress bar */}
            <div className="pt-2 space-y-1.5 border-t border-slate-100">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Đã hoàn thành 3 trên 7 bước</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-700 rounded-full transition-all" style={{ width: '42.8%' }}></div>
              </div>
            </div>
          </div>

          {/* Social Community Feed List */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3.5 relative">
                {/* Author Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-100"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">{post.authorName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{post.authorRole}</span>
                        <span>•</span>
                        <span>{post.timeAgo}</span>
                        <span>•</span>
                        <Globe className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Content text */}
                <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-1">
                  {post.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] bg-slate-50 border border-slate-250/50 text-slate-500 py-0.5 px-2 rounded-md font-bold"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Interaction footer with clean rounded pill buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    {/* Likes pill */}
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`py-1.5 px-4 rounded-full text-xs font-bold border border-slate-200/80 transition-all cursor-pointer flex items-center gap-1.5 ${
                        post.hasLiked 
                          ? 'bg-red-50 text-red-500 border-red-100' 
                          : 'bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                      <span>{post.likesCount}</span>
                    </button>

                    {/* Comments pill */}
                    <button className="py-1.5 px-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 cursor-pointer transition-all flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.commentsCount}</span>
                    </button>
                  </div>

                  {/* Booking slot / share shortcut */}
                  {post.mentorId ? (
                    <button
                      onClick={() => handleOpenBooking(post.mentorId!)}
                      className="flex items-center gap-1.5 bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-primary text-[10px] font-bold py-1.5 px-4 rounded-full border border-brand-secondary/20 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Đặt lịch Mentor</span>
                    </button>
                  ) : (
                    <button className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-full border border-slate-200/80 cursor-pointer transition-all flex items-center justify-center">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Widgets Column (Right) */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Location / Campus Widget */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
            <div className="flex gap-3.5 items-center">
              {/* Radar target circles widget */}
              <div className="w-10 h-10 rounded-full border border-slate-200/80 flex items-center justify-center bg-slate-50 relative shrink-0">
                <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 animate-pulse"></div>
                </div>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900 block leading-tight">Cơ sở TP. Hồ Chí Minh</h4>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Quận 9, TP. HCM</span>
              </div>
            </div>
            
            <a
              href="#alerts"
              onClick={(e) => { e.preventDefault(); alert("Đang tải các thông báo quan trọng tại campus..."); }}
              className="w-full flex justify-between items-center py-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-800 hover:text-slate-900 group"
            >
              <span>Xem thông báo campus</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-all" />
            </a>
          </div>

          {/* Promotional / Call-to-action widget */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col">
            <img 
              src="/exchange_illustration.png" 
              alt="Study Exchange Illustration" 
              className="w-full h-36 object-cover rounded-2xl border border-slate-100"
            />
            <div className="space-y-1.5 text-left">
              <h4 className="text-xs font-extrabold text-slate-900 leading-snug">Bạn có chuyên môn giảng dạy?</h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Đăng ký trở thành Mentor của dự án học tập SkillSwap. Báo cáo lịch dạy học chéo sẽ được duyệt tự động sang điểm rèn luyện campus.
              </p>
            </div>
            <Link
              to="/profile"
              className="w-full flex justify-between items-center py-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-800 hover:text-slate-900 group"
            >
              <span>Đăng ký Mentor ngay</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-all" />
            </Link>
          </div>

          {/* Student Profile Overview Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4">
            <h3 className="text-slate-900 font-bold text-xs border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" /> Tóm tắt thông tin học viên
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">MSSV</span>
                <span className="font-bold text-slate-800">SE192621</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Ngành học</span>
                <span className="font-bold text-slate-800">Kỹ thuật phần mềm</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Cơ sở FPT</span>
                <span className="font-bold text-slate-800">FPT TP. HCM</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Học kỳ</span>
                <span className="font-bold text-slate-800">Học kỳ 5</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Vai trò chính</span>
                <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-slate-200">
                  {user?.roles?.[0] || 'MENTEE'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/profile"
                className="w-full flex items-center justify-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/60 text-xs font-bold transition-all"
              >
                Cập nhật thông tin học tập
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Booking Modal (keeps current booking scheduler functional) */}
      {showBookingModal && activeMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/40 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border border-green-200">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-slate-900 font-bold text-base">Yêu cầu đã gửi thành công!</h3>
                <p className="text-slate-500 text-xs font-semibold px-4">Đề xuất trao đổi kỹ năng đã được chuyển tiếp tới {activeMentor.name}. Bạn có thể theo dõi tiến độ ở lịch học cá nhân.</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="text-left border-b border-slate-100 pb-3">
                  <h3 className="text-slate-900 font-bold text-base">Đặt lịch với {activeMentor.name}</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Chọn khung thời gian và ghi rõ kỹ năng trao đổi chéo</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left">
                  <img
                    src={activeMentor.avatarUrl}
                    alt={activeMentor.name}
                    className="w-10 h-10 rounded-full border border-slate-200"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{activeMentor.name}</span>
                    <span className="text-[10px] text-brand-primary font-extrabold uppercase mt-0.5 block">{activeMentor.specialization}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày hẹn</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-350 cursor-pointer font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Giờ hẹn</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-350 cursor-pointer font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thỏa thuận trao đổi kỹ năng</label>
                  <textarea
                    required
                    rows={3}
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Ví dụ: Mình hỗ trợ bạn cài đặt Linux/Docker, đổi lại bạn có thể chỉ mình cơ bản về React Hook được không?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-350 resize-none placeholder-slate-400 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold py-3 px-4 rounded-xl cursor-pointer hover:opacity-95 transition-all active:scale-[0.98] shadow-sm mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi lời mời học chéo</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Chats Drawer sitting fixed at bottom right of screen */}
      <div className="fixed bottom-0 right-6 z-45 bg-white border border-slate-200 shadow-2xl rounded-t-2xl w-72 transition-all">
        {/* Drawer Header click toggles open */}
        <button
          onClick={() => setChatsOpen(!chatsOpen)}
          className="w-full px-4 py-3.5 bg-white border-b border-slate-100 text-slate-800 rounded-t-2xl flex items-center justify-between font-bold text-xs select-none focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>Trò chuyện trực tiếp</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <MessageCircle className="w-4.5 h-4.5 text-brand-primary" />
            {chatsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Drawer Body lists active chats */}
        {chatsOpen && (
          <div className="bg-white max-h-80 overflow-y-auto divide-y divide-slate-100 py-1 text-left animate-slideUp">
            {[
              { id: 'm1', name: 'Trần Hoàng Long', role: 'Mentor AI/ML', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long', online: true },
              { id: 'm2', name: 'Lê Minh Hương', role: 'Mentor Fullstack', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong', online: true },
              { id: 'm5', name: 'Nguyễn Hoàng Nam', role: 'Mentee Thiết kế', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam', online: false }
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => navigate('/chat')}
                className="w-full p-3 flex gap-2.5 items-center hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="relative shrink-0">
                  <img src={c.avatar} className="w-8 h-8 rounded-full border border-slate-100 object-cover" />
                  {c.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-800 block truncate">{c.name}</span>
                  <span className="text-[9px] text-slate-400 font-bold block">{c.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
