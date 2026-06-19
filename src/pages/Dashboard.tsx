import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, MessageSquare, Sparkles, BookOpen, Calendar,
  Heart, Image as ImageIcon, X, MoreHorizontal, Globe,
  ChevronLeft, ChevronRight, MessageCircle, ChevronUp, ChevronDown, Loader2,
} from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';
import { studentProfileApi } from '../api/studentProfile';
import { catalogApi } from '../api/catalog';
import type { StudentProfile } from '../api/types';

// LƯU Ý: Bảng tin cộng đồng (feed) và khung chat dưới đây vẫn dùng dữ liệu mẫu
// vì backend hiện CHƯA có Forum/Chat API. Phần hồ sơ học viên ở cột phải đã được
// nối với dữ liệu thật (GET /api/me/student-profile + danh mục campus/ngành).
interface FeedPost {
  id: string; authorName: string; authorAvatar: string; authorRole: string;
  timeAgo: string; content: string; skills: string[];
  likesCount: number; commentsCount: number; hasLiked?: boolean;
  imageUrl?: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ----- Hồ sơ học viên thật -----
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [campusName, setCampusName] = useState('');
  const [programName, setProgramName] = useState('');

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const [p, campuses, programs] = await Promise.all([
          studentProfileApi.get().catch(() => null),
          catalogApi.getCampuses().catch(() => []),
          catalogApi.getPrograms().catch(() => []),
        ]);
        if (!active) return;
        setProfile(p);
        if (p) {
          setCampusName(campuses.find((c) => c.id === p.campusId)?.name || '');
          setProgramName(programs.find((pr) => pr.id === p.programId)?.nameVi || '');
        }
      } catch (err) {
        console.warn('Không tải được hồ sơ học viên', err);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, []);

  const [posts, setPosts] = useState<FeedPost[]>([
    {
      id: 'p1', authorName: 'Trần Hoàng Long',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
      authorRole: 'Mentor AI/ML (K18)', timeAgo: '2 giờ trước',
      content: 'Chào các bạn K19, tối nay mình có mở slot rảnh học 1-1 về PyTorch cơ bản lúc 20:00. Bạn nào đang làm Lab 2 mà gặp lỗi kẹt ở bước train model thì đặt lịch hẹn qua mục Khám phá Mentor nhé!',
      skills: ['Python', 'PyTorch', 'Deep Learning'],
      likesCount: 15, commentsCount: 3, hasLiked: false,
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

  const stepperScrollRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const composerFileInputRef = useRef<HTMLInputElement>(null);
  const [chatsOpen, setChatsOpen] = useState(false);

  // Đính kèm ảnh khi đăng tin: FE upload trực tiếp lên Cloudinary, lưu lại fileUrl để gắn vào bài đăng.
  const composerImageUpload = useImageUpload({ usage: 'FORUM_POST' });

  const handleComposerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await composerImageUpload.upload(file);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() && !composerImageUpload.result) return;
    const newPost: FeedPost = {
      id: `p_custom_${Date.now()}`,
      authorName: user?.fullName || 'Demo User',
      authorAvatar: user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      authorRole: user?.roles?.[0] === 'MENTOR' ? 'Mentor học thuật' : 'Sinh viên (Mentee)',
      timeAgo: 'Vừa xong', content: composerText, skills: ['Thảo luận chéo'],
      likesCount: 0, commentsCount: 0, hasLiked: false,
      imageUrl: composerImageUpload.result?.fileUrl,
    };
    setPosts([newPost, ...posts]);
    setComposerText('');
    composerImageUpload.reset();
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

  const scrollChecklist = (direction: 'left' | 'right') => {
    if (stepperScrollRef.current) {
      const { scrollLeft } = stepperScrollRef.current;
      stepperScrollRef.current.scrollTo({ left: direction === 'left' ? scrollLeft - 290 : scrollLeft + 290, behavior: 'smooth' });
    }
  };

  const steps = [
    { icon: <BookOpen className="w-5 h-5" />, title: 'Bạn có chuyên môn học thuật?', desc: 'Cấu hình hồ sơ chuyên môn và giảng dạy để kết nối trao đổi chéo.', to: '/profile', cta: 'Bắt đầu ngay' },
    { icon: <Sparkles className="w-5 h-5" />, title: 'Tìm kiếm đề xuất phù hợp', desc: 'Xem danh mục Mentor rảnh trong campus được đề xuất riêng cho bạn.', to: '/mentors', cta: 'Khám phá' },
    { icon: <Calendar className="w-5 h-5" />, title: 'Quản lý lịch hẹn học chéo', desc: 'Theo dõi yêu cầu rảnh và phê duyệt lịch hẹn từ bạn học ở Dashboard.', to: '/bookings', cta: 'Xem lịch hẹn' },
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
          <div className="ss-card rounded-card p-4 space-y-3">
            <div className="flex items-center gap-3.5">
              {user && <img src={user.avatarUrl} alt={user.fullName} className="w-11 h-11 rounded-full object-cover shrink-0" />}
              <div className="flex-1 bg-surface-muted rounded-pill py-3 px-5 flex items-center">
                <input
                  type="text" value={composerText} ref={composerInputRef}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Có chuyện gì thế? Chia sẻ tin học tập..."
                  className="bg-transparent border-none outline-none flex-1 text-body text-fg placeholder-fg-muted"
                />
              </div>
              <input
                type="file" accept="image/jpeg,image/png,image/webp,image/gif" ref={composerFileInputRef}
                className="hidden" onChange={handleComposerImageChange}
              />
              <button
                type="button" title="Đính kèm ảnh" disabled={composerImageUpload.uploading}
                onClick={() => composerFileInputRef.current?.click()}
                className="p-3 bg-surface-muted hover:opacity-80 text-fg-muted rounded-field transition-all shrink-0 disabled:opacity-50"
              >
                {composerImageUpload.uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              </button>
              <button onClick={handleCreatePost}
                className="bg-action hover:bg-action-hover text-on-action rounded-field px-6 py-3 text-body font-bold transition-all active:scale-95 cursor-pointer shrink-0">
                Đăng tin
              </button>
            </div>

            {composerImageUpload.error && (
              <p className="text-meta font-semibold text-red-600 pl-[3.7rem]">{composerImageUpload.error}</p>
            )}

            {composerImageUpload.result && (
              <div className="relative inline-block pl-[3.7rem]">
                <img src={composerImageUpload.result.fileUrl} alt="Ảnh đính kèm" className="h-24 rounded-field object-cover border border-line" />
                <button
                  type="button" onClick={() => composerImageUpload.reset()} title="Bỏ ảnh"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-fg text-bg flex items-center justify-center shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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

                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Ảnh đính kèm bài đăng" className="w-full max-h-96 object-cover rounded-field border border-line" />
                )}

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

                  <button onClick={() => navigate('/mentors')}
                    className="flex items-center gap-2 bg-primary-soft hover:opacity-80 text-primary text-meta font-bold py-2 px-4 rounded-pill border border-primary/20 transition-all cursor-pointer">
                    <Calendar className="w-4 h-4" /><span>Tìm Mentor</span>
                  </button>
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
                <h4 className="text-body font-bold text-fg block leading-tight">{campusName || 'Cơ sở FPT University'}</h4>
                <span className="text-meta text-fg-faint font-semibold block mt-0.5">SkillSwap Campus</span>
              </div>
            </div>
            <Link to="/mentors" className="w-full flex justify-between items-center pt-3 border-t border-line-soft text-body font-bold text-fg hover:text-primary group transition-colors">
              <span>Khám phá Mentor cùng cơ sở</span>
              <ChevronRight className="w-4.5 h-4.5 text-fg-faint group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
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

          {/* Profile overview (dữ liệu thật) */}
          <div className="ss-card rounded-card p-5 space-y-4">
            <h3 className="text-fg font-bold text-body border-b border-line-soft pb-3 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-fg-muted" /> Tóm tắt thông tin học viên
            </h3>
            <div className="space-y-3">
              {[
                ['MSSV', profile?.studentCode || 'Chưa cập nhật'],
                ['Ngành học', programName || 'Chưa cập nhật'],
                ['Cơ sở FPT', campusName || 'Chưa cập nhật'],
                ['Học kỳ', profile?.semester ? `Học kỳ ${profile.semester}` : 'Chưa cập nhật'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-body">
                  <span className="text-fg-muted font-semibold">{k}</span>
                  <span className="font-bold text-fg">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-body">
                <span className="text-fg-muted font-semibold">Vai trò chính</span>
                <span className="bg-surface-muted text-fg-muted text-meta font-extrabold uppercase px-2.5 py-1 rounded-md border border-line">
                  {user?.roles?.[0] || 'MENTEE'}
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

      {/* ===== Floating chats drawer (mock — BE chưa có Chat API) ===== */}
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
