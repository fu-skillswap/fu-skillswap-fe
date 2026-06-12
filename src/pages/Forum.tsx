import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Tag, Plus, Search, Check, X, ShieldAlert, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ForumThread {
  id: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  hasUpvoted?: boolean;
  replies: ForumReply[];
  createdAt: string;
}

interface ForumReply {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export const Forum: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(queryParam);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);
  
  // Mock Threads Data
  const [threads, setThreads] = useState<ForumThread[]>([
    {
      id: 't1',
      authorName: 'Nguyễn Tiến Đạt',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
      title: 'Xin tài liệu ôn tập môn SWE302 (Software Requirement) đề thi thực tế',
      content: 'Chào các bạn, tuần sau mình thi môn SWE302 mà chưa nắm rõ cách viết Use Case Specification chuẩn. Bạn nào có tài liệu tóm tắt hoặc đề mẫu K18 cho mình xin tham khảo với ạ, cảm ơn nhiều!',
      category: 'SE',
      tags: ['SWE302', 'Requirements', 'FPTU'],
      upvotes: 12,
      hasUpvoted: false,
      createdAt: '3 giờ trước',
      replies: [
        {
          id: 'rep1_1',
          authorName: 'Trần Hoàng Long',
          authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
          content: 'Mình có file Docs tóm tắt lý thuyết và 3 đề mẫu Use Case hồi học kỳ trước được 9.5 điểm. Tối nay mình gửi link Google Drive cho nha.',
          createdAt: '2 giờ trước'
        },
        {
          id: 'rep1_2',
          authorName: 'Nguyễn Tiến Đạt',
          authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dat',
          content: 'Ôi tốt quá! Cảm ơn anh Long nhiều ạ!',
          createdAt: '1 giờ trước'
        }
      ]
    },
    {
      id: 't2',
      authorName: 'Lê Minh Hương',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
      title: 'Cách sửa lỗi CORS khi gọi API từ React localhost lên Back-end Spring Boot?',
      content: 'Mình đang deploy thử Back-end lên VPS IP tĩnh nhưng khi gọi Axios từ React dưới localhost lên thì bị chặn bởi CORS policy. Đã thử thêm `@CrossOrigin` ở Controller Spring Boot nhưng vẫn lỗi. Có ai gặp trường hợp tương tự chưa?',
      category: 'WEB',
      tags: ['React', 'Spring Boot', 'CORS', 'API'],
      upvotes: 24,
      hasUpvoted: true,
      createdAt: '6 giờ trước',
      replies: [
        {
          id: 'rep2_1',
          authorName: 'Trần Hoàng Long',
          authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=long',
          content: 'Bạn thử cấu hình WebMvcConfigurer thay vì gắn Annotation lẻ ở Controller nhé. Config global CORS filter sẽ giải quyết triệt để vấn đề.',
          createdAt: '4 giờ trước'
        }
      ]
    },
    {
      id: 't3',
      authorName: 'Nguyễn Hoàng Nam',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
      title: 'Lập nhóm ôn thi Practical Exam môn AI (AIL302m) - Ôn tập PyTorch',
      content: 'Kỳ này thi thực hành AI bắt buộc code mạng neural trên PyTorch. Nhóm mình hiện có 2 người, muốn tìm thêm 2 bạn cùng phòng lab học chung vào tối thứ 4 và thứ 6 hàng tuần để ôn các bài phân loại ảnh và NLP cơ bản.',
      category: 'AI',
      tags: ['AIL302m', 'AI', 'PyTorch', 'Học Nhóm'],
      upvotes: 18,
      hasUpvoted: false,
      createdAt: '1 ngày trước',
      replies: []
    }
  ]);

  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('WEB');
  const [newTags, setNewTags] = useState('');
  const [newComment, setNewComment] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', name: 'Tất cả chủ đề' },
    { id: 'WEB', name: 'Lập trình Web' },
    { id: 'AI', name: 'Trí tuệ nhân tạo' },
    { id: 'SE', name: 'Kỹ nghệ phần mềm' },
    { id: 'DESIGN', name: 'UI/UX & Graphics' }
  ];

  const handleUpvote = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening thread detail when upvoting
    setThreads(
      threads.map((t) => {
        if (t.id === threadId) {
          const hasUpvoted = !t.hasUpvoted;
          const upvotes = hasUpvoted ? t.upvotes + 1 : t.upvotes - 1;
          return { ...t, hasUpvoted, upvotes };
        }
        return t;
      })
    );
  };

  const handleCreateThreadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsArr = newTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newThread: ForumThread = {
      id: `t_custom_${Date.now()}`,
      authorName: user?.fullName || 'Demo User',
      authorAvatar: user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      title: newTitle,
      content: newContent,
      category: newCategory,
      tags: tagsArr.length ? tagsArr : ['General'],
      upvotes: 0,
      hasUpvoted: false,
      createdAt: 'Vừa xong',
      replies: []
    };

    setThreads([newThread, ...threads]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewContent('');
    setNewCategory('WEB');
    setNewTags('');
    setSuccessMsg('Đã tạo chủ đề thảo luận mới thành công!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeThread) return;

    const reply: ForumReply = {
      id: `r_${Date.now()}`,
      authorName: user?.fullName || 'Demo User',
      authorAvatar: user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      content: newComment,
      createdAt: 'Vừa xong'
    };

    const updatedThreads = threads.map((t) => {
      if (t.id === activeThread.id) {
        const updated = { ...t, replies: [...t.replies, reply] };
        setActiveThread(updated); // Update detail view
        return updated;
      }
      return t;
    });

    setThreads(updatedThreads);
    setNewComment('');
  };

  const filteredThreads = threads.filter((t) => {
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-slate-700" /> Diễn đàn thảo luận
          </h1>
          <p className="text-brand-text-muted text-xs font-semibold mt-1">
            Nơi chia sẻ câu hỏi học thuật, tài liệu ôn thi môn học, và tìm bạn ghép nhóm trao đổi kỹ năng.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4.5 rounded-full cursor-pointer active:scale-95 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo chủ đề thảo luận</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-xs font-semibold">
          <Check className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid layout (Nearlist style) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Categories filter */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-2.5">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 text-left">
              Chuyên mục thảo luận
            </h3>
            <div className="flex flex-col gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-100 text-slate-900 font-extrabold border-l-4 border-slate-900 shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl text-left bg-gradient-to-br from-slate-100/30 to-transparent space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-slate-700" /> Nội quy diễn đàn
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Vui lòng thảo luận văn minh, chỉ đăng các nội dung liên quan tới học tập tại FPTU. Không spam hoặc mua bán.
            </p>
          </div>
        </div>

        {/* Center/Right Columns (Timeline Feed & Thread Detail modal) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-grey" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chủ đề thảo luận hoặc từ khóa tag..."
              className="w-full bg-white border border-brand-border rounded-2xl py-3 pl-10 pr-4 text-xs text-brand-text focus:outline-none focus:border-slate-800 transition-all font-semibold"
            />
          </div>

          {/* Discussion feed list */}
          <div className="space-y-4">
            {filteredThreads.length === 0 ? (
              <div className="meetmind-card py-16 text-center text-brand-text-muted text-xs font-semibold rounded-3xl">
                Không tìm thấy chủ đề thảo luận nào phù hợp.
              </div>
            ) : (
              filteredThreads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setActiveThread(t)}
                  className="meetmind-card meetmind-card-hover p-6 rounded-3xl space-y-4 relative overflow-hidden cursor-pointer"
                >
                  {/* Author Header */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={t.authorAvatar}
                        alt={t.authorName}
                        className="w-8 h-8 rounded-lg object-cover border border-brand-border"
                      />
                      <span className="font-bold text-brand-text">{t.authorName}</span>
                    </div>
                    <span className="text-slate-400 font-semibold">{t.createdAt}</span>
                  </div>

                  {/* Body Title & Text */}
                  <div className="text-left space-y-1.5">
                    <h3 className="text-base font-bold text-brand-text font-serif leading-tight hover:text-slate-800 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-brand-text-muted text-xs leading-relaxed font-medium line-clamp-2">
                      {t.content}
                    </p>
                  </div>

                  {/* Footer metadata & buttons */}
                  <div className="flex items-center justify-between border-t border-brand-border/60 pt-3 text-xs">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {t.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-0.5 text-[9px] bg-slate-50 border border-slate-200 text-slate-500 font-bold py-0.5 px-2 rounded-md"
                        >
                          <Tag className="w-2.5 h-2.5" /> {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={(e) => handleUpvote(t.id, e)}
                        className={`flex items-center gap-1.5 font-bold cursor-pointer px-3 py-1 rounded-full text-xs transition-all ${
                          t.hasUpvoted ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{t.upvotes} Hữu ích</span>
                      </button>

                      <span className="flex items-center gap-1 font-bold text-slate-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.replies.length} Phản hồi</span>
                      </span>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Expanded Thread Drawer / Detail Overlay */}
      {activeThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-brand-border rounded-3xl p-6 relative shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            
            <button
              onClick={() => setActiveThread(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Container */}
            <div className="overflow-y-auto space-y-6 flex-1 pr-1">
              
              {/* Thread Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <img
                    src={activeThread.authorAvatar}
                    alt={activeThread.authorName}
                    className="w-9 h-9 rounded-lg border border-brand-border object-cover"
                  />
                  <div>
                    <span className="font-bold text-brand-text block">{activeThread.authorName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">Đăng {activeThread.createdAt}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold font-serif text-brand-text leading-snug">
                  {activeThread.title}
                </h2>
                
                <p className="text-xs text-brand-text font-medium leading-relaxed bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                  {activeThread.content}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {activeThread.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] bg-slate-50 border border-slate-200 text-slate-500 font-bold py-0.5 px-2 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Replies/Comments List */}
              <div className="space-y-4 border-t border-brand-border/60 pt-4">
                <h3 className="text-xs font-extrabold text-brand-text-muted uppercase tracking-wider">
                  Ý kiến thảo luận ({activeThread.replies.length})
                </h3>

                {activeThread.replies.length === 0 ? (
                  <p className="text-xs text-brand-text-muted font-medium py-4">Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!</p>
                ) : (
                  <div className="space-y-3.5">
                    {activeThread.replies.map((rep) => (
                      <div key={rep.id} className="flex gap-3 items-start bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
                        <img
                          src={rep.authorAvatar}
                          alt={rep.authorName}
                          className="w-8 h-8 rounded-lg object-cover border border-brand-border mt-0.5"
                        />
                        <div className="flex-1 space-y-1 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-brand-text">{rep.authorName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{rep.createdAt}</span>
                          </div>
                          <p className="text-brand-text-muted font-medium leading-relaxed">
                            {rep.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Comment Composer Form (Sticky bottom) */}
            <form onSubmit={handleAddCommentSubmit} className="border-t border-brand-border/60 pt-4 mt-4 space-y-3">
              <div className="flex gap-3">
                <img
                  src={user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={user?.fullName}
                  className="w-9 h-9 rounded-lg object-cover border border-brand-border"
                />
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Nhập ý kiến thảo luận của bạn..."
                  rows={2}
                  className="flex-1 bg-slate-50 border border-brand-border rounded-2xl py-2 px-3 text-xs text-brand-text focus:outline-none focus:border-slate-800 resize-none font-medium placeholder-slate-400"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4.5 rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Trả lời</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-brand-border rounded-3xl p-6 relative shadow-2xl text-left space-y-4">
            
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold font-serif text-brand-text">Tạo chủ đề thảo luận mới</h3>
              <p className="text-brand-text-muted text-xs font-medium">Đặt câu hỏi học thuật hoặc kêu gọi thành lập nhóm học chéo.</p>
            </div>

            <form onSubmit={handleCreateThreadSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase mb-1.5">Tiêu đề thảo luận (Súc tích)</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Xin đề mẫu môn AIL302 Practical Exam..."
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none focus:border-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase mb-1.5">Chuyên mục chính</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none focus:border-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="WEB">Lập trình Web</option>
                    <option value="AI">Trí tuệ nhân tạo</option>
                    <option value="SE">Kỹ nghệ phần mềm</option>
                    <option value="DESIGN">UI/UX & Graphics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted uppercase mb-1.5">Tags (Phân tách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Ví dụ: AI, Python, K19"
                    className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none focus:border-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted uppercase mb-1.5">Nội dung chi tiết</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Gợi ý: Hãy mô tả cụ thể câu hỏi hoặc điểm bạn cần được mentor hướng dẫn chéo, và kỹ năng bạn có thể trao lại..."
                  className="w-full bg-slate-50 border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none focus:border-slate-800 resize-none font-medium placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 px-4 rounded-full cursor-pointer active:scale-[0.98] transition-all"
              >
                Đăng bài thảo luận
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
