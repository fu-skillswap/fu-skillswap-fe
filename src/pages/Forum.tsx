import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare, ThumbsUp, Tag, Plus, Search, Check, X, ShieldAlert, Smile,
  Loader2, Trash2, Flag, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forumApi } from '../api/forum';
import { helpTopicApi } from '../api/mentorProfile';
import { onAvatarError } from '../lib/img';
import type {
  ForumPost, ForumComment, HelpTopic, ForumReportTargetType, ForumReportReasonType,
} from '../api/types';

/* ---------------------------------------------------------------------------
 * Diễn đàn thảo luận — dữ liệu thật từ BE (module forum mới).
 * Chủ đề lọc theo help-topic (dùng chung danh mục catalog). Reaction là LIKE.
 * ------------------------------------------------------------------------- */

const REPORT_REASONS: { value: ForumReportReasonType; label: string }[] = [
  { value: 'SPAM', label: 'Spam / quảng cáo' },
  { value: 'OFF_TOPIC', label: 'Lạc chủ đề' },
  { value: 'HARASSMENT', label: 'Quấy rối / xúc phạm' },
  { value: 'MISLEADING', label: 'Sai lệch / gây hiểu nhầm' },
  { value: 'OTHER', label: 'Khác' },
];

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const m = Math.floor((Date.now() - then) / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const AVA_FALLBACK = 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';

export const Forum: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const postParam = searchParams.get('post');

  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [mine, setMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParam);

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activePost, setActivePost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTopicId, setNewTopicId] = useState('');
  const [creating, setCreating] = useState(false);

  const [reportTarget, setReportTarget] = useState<{ type: ForumReportTargetType; id: string } | null>(null);
  const [reportReason, setReportReason] = useState<ForumReportReasonType>('SPAM');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const flash = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { setSearchQuery(queryParam); }, [queryParam]);

  // Danh mục help-topic cho filter + form tạo bài.
  useEffect(() => {
    helpTopicApi.list().then((t) => {
      setTopics(t ?? []);
      if (t?.length) setNewTopicId((prev) => prev || t[0].id);
    }).catch(() => {});
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await forumApi.listPosts({
        keyword: searchQuery,
        helpTopicId: selectedTopic === 'ALL' ? undefined : selectedTopic,
        mine,
        size: 30,
      });
      setPosts(res.content ?? []);
    } catch (e: any) {
      setLoadError(e?.response?.data?.message || 'Không tải được danh sách bài viết.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTopic, mine]);

  // Reload có debounce cho search; đổi topic/mine reload ngay.
  useEffect(() => {
    const t = setTimeout(loadPosts, 350);
    return () => clearTimeout(t);
  }, [loadPosts]);

  const openedPostParam = useRef(false);

  const openDetail = async (post: ForumPost) => {
    setActivePost(post);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await forumApi.listComments(post.postId);
      setComments(res.content ?? []);
    } catch {
      /* im lặng */
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeDetail = () => {
    setActivePost(null);
    if (postParam) { searchParams.delete('post'); setSearchParams(searchParams, { replace: true }); }
  };

  // Cập nhật 1 post trong cả list lẫn detail từ response BE.
  const patchPost = (p: ForumPost) => {
    setPosts((prev) => prev.map((x) => (x.postId === p.postId ? p : x)));
    setActivePost((cur) => (cur && cur.postId === p.postId ? p : cur));
  };

  // Mở sẵn post nếu deep-link ?post=<id> (từ notification).
  useEffect(() => {
    if (!postParam || openedPostParam.current) return;
    openedPostParam.current = true;
    forumApi.getPost(postParam).then((p) => openDetail(p)).catch(() => {});
  }, [postParam]);

  const toggleReaction = async (post: ForumPost, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = post.reactedByCurrentUser
        ? await forumApi.unreact(post.postId)
        : await forumApi.react(post.postId, 'LIKE');
      patchPost(updated);
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Không thực hiện được thao tác.', false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newTopicId) return;
    setCreating(true);
    try {
      await forumApi.createPost({ title: newTitle.trim(), content: newContent.trim(), helpTopicId: newTopicId });
      setShowCreateModal(false);
      setNewTitle(''); setNewContent('');
      flash('Đã đăng bài thảo luận mới!');
      await loadPosts();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Không đăng được bài viết.', false);
    } finally {
      setCreating(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activePost) return;
    setPostingComment(true);
    try {
      const created = await forumApi.createComment(activePost.postId, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
      // Tăng commentCount hiển thị.
      patchPost({ ...activePost, commentCount: (activePost.commentCount ?? 0) + 1 });
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Không gửi được bình luận.', false);
    } finally {
      setPostingComment(false);
    }
  };

  const deletePost = async (post: ForumPost) => {
    if (!window.confirm('Xoá bài viết này?')) return;
    try {
      await forumApi.deletePost(post.postId);
      setPosts((prev) => prev.filter((p) => p.postId !== post.postId));
      if (activePost?.postId === post.postId) setActivePost(null);
      flash('Đã xoá bài viết.');
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Không xoá được bài viết.', false);
    }
  };

  const deleteComment = async (comment: ForumComment) => {
    try {
      await forumApi.deleteComment(comment.commentId);
      setComments((prev) => prev.filter((c) => c.commentId !== comment.commentId));
      if (activePost) patchPost({ ...activePost, commentCount: Math.max(0, (activePost.commentCount ?? 1) - 1) });
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Không xoá được bình luận.', false);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    setReporting(true);
    try {
      await forumApi.report({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reasonType: reportReason,
        description: reportDesc.trim() || undefined,
      });
      setReportTarget(null); setReportDesc(''); setReportReason('SPAM');
      flash('Đã gửi báo cáo. Cảm ơn bạn!');
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Không gửi được báo cáo.', false);
    } finally {
      setReporting(false);
    }
  };

  const isMine = (authorUserId: string) => !!user && authorUserId === user.publicId;

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold text-fg tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-fg-muted" /> Diễn đàn thảo luận
          </h1>
          <p className="text-brand-text-muted text-body font-semibold mt-1">
            Nơi chia sẻ câu hỏi học thuật, tài liệu ôn thi môn học, và tìm bạn ghép nhóm trao đổi kỹ năng.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-body font-bold py-2.5 px-4.5 rounded-full cursor-pointer active:scale-95 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> <span>Tạo chủ đề thảo luận</span>
        </button>
      </div>

      {toast && (
        <div className={`flex items-start gap-3 p-4 rounded-field text-body font-semibold border ${toast.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.ok ? <Check className="w-4.5 h-4.5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: topic filter */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface border border-line p-5 rounded-card space-y-2.5">
            <h3 className="text-meta font-extrabold text-fg-faint uppercase tracking-wider mb-2">Chuyên mục thảo luận</h3>
            <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedTopic('ALL')}
                className={`w-full text-left py-2.5 px-3.5 text-body font-bold rounded-field transition-all cursor-pointer ${selectedTopic === 'ALL' ? 'bg-brand-primary/10 text-brand-primary font-extrabold border-l-4 border-brand-primary shadow-xs' : 'text-fg-muted hover:bg-surface-muted hover:text-brand-primary'}`}
              >
                Tất cả chủ đề
              </button>
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.id)}
                  className={`w-full text-left py-2.5 px-3.5 text-body font-bold rounded-field transition-all cursor-pointer ${selectedTopic === t.id ? 'bg-brand-primary/10 text-brand-primary font-extrabold border-l-4 border-brand-primary shadow-xs' : 'text-fg-muted hover:bg-surface-muted hover:text-brand-primary'}`}
                >
                  {t.nameVi}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-body font-bold text-fg-muted cursor-pointer pt-2 border-t border-line">
              <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Chỉ bài của tôi
            </label>
          </div>

          <div className="bg-surface border border-line p-5 rounded-card space-y-2">
            <h4 className="text-body font-bold text-fg flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-fg-muted" /> Nội quy diễn đàn
            </h4>
            <p className="text-meta text-fg-muted leading-relaxed font-semibold">
              Vui lòng thảo luận văn minh, chỉ đăng các nội dung liên quan tới học tập tại FPTU. Không spam hoặc mua bán.
            </p>
          </div>
        </div>

        {/* Right: feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-grey" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chủ đề thảo luận hoặc từ khóa..."
              className="w-full bg-surface border border-brand-border rounded-card py-3 pl-10 pr-4 text-body text-brand-text focus:outline-none focus:border-brand-secondary transition-all font-semibold"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="meetmind-card py-16 flex justify-center text-brand-text-muted rounded-card"><Loader2 className="w-7 h-7 animate-spin" /></div>
            ) : loadError ? (
              <div className="meetmind-card py-12 text-center text-danger font-bold rounded-card">{loadError}</div>
            ) : posts.length === 0 ? (
              <div className="meetmind-card py-16 text-center text-brand-text-muted text-body font-semibold rounded-card">
                Không tìm thấy chủ đề thảo luận nào phù hợp.
              </div>
            ) : (
              posts.map((p) => (
                <div
                  key={p.postId}
                  onClick={() => openDetail(p)}
                  className="meetmind-card meetmind-card-hover p-6 rounded-card space-y-4 relative overflow-hidden cursor-pointer"
                >
                  <div className="flex justify-between items-center text-body">
                    <div className="flex items-center gap-2.5">
                      <img src={p.authorAvatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={p.authorFullName} className="w-8 h-8 rounded-lg object-cover border border-brand-border" />
                      <span className="font-bold text-brand-text">{p.authorFullName}</span>
                    </div>
                    <span className="text-fg-faint font-semibold">{timeAgo(p.createdAt)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-brand-text font-serif leading-tight hover:text-brand-primary transition-colors">{p.title}</h3>
                    <p className="text-brand-text-muted text-body leading-relaxed font-medium line-clamp-2">{p.content}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-brand-border/60 pt-3 text-body">
                    <div className="flex flex-wrap gap-1.5">
                      {p.helpTopic && (
                        <span className="inline-flex items-center gap-0.5 text-meta bg-surface-muted border border-line text-fg-muted font-bold py-0.5 px-2 rounded-md">
                          <Tag className="w-2.5 h-2.5" /> {p.helpTopic.nameVi}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => toggleReaction(p, e)}
                        className={`flex items-center gap-1.5 font-bold cursor-pointer px-3 py-1 rounded-full text-body transition-all ${p.reactedByCurrentUser ? 'bg-brand-secondary/15 text-brand-primary' : 'bg-surface-muted hover:bg-surface-muted text-fg-muted hover:text-brand-primary'}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> <span>{p.reactionCount} Hữu ích</span>
                      </button>
                      <span className="flex items-center gap-1 font-bold text-fg-faint">
                        <MessageSquare className="w-3.5 h-3.5" /> <span>{p.commentCount} Phản hồi</span>
                      </span>
                      {isMine(p.authorUserId) && (
                        <button onClick={(e) => { e.stopPropagation(); deletePost(p); }} title="Xoá bài" className="text-fg-faint hover:text-danger">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            <button onClick={closeDetail} className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="overflow-y-auto space-y-6 flex-1 pr-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <img src={activePost.authorAvatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={activePost.authorFullName} className="w-9 h-9 rounded-lg border border-brand-border object-cover" />
                  <div>
                    <span className="font-bold text-brand-text block">{activePost.authorFullName}</span>
                    <span className="text-meta text-fg-faint font-semibold block">Đăng {timeAgo(activePost.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => setReportTarget({ type: 'POST', id: activePost.postId })}
                    className="ml-auto mr-8 flex items-center gap-1 text-meta font-bold text-fg-faint hover:text-danger"
                  >
                    <Flag className="w-3.5 h-3.5" /> Báo cáo
                  </button>
                </div>

                <h2 className="text-xl font-bold font-serif text-brand-text leading-snug">{activePost.title}</h2>
                <p className="text-body text-brand-text font-medium leading-relaxed bg-surface-muted border border-line p-4 rounded-card whitespace-pre-wrap">{activePost.content}</p>

                <div className="flex items-center gap-3">
                  {activePost.helpTopic && (
                    <span className="text-meta bg-surface-muted border border-line text-fg-muted font-bold py-0.5 px-2 rounded-md">#{activePost.helpTopic.nameVi}</span>
                  )}
                  <button
                    onClick={() => toggleReaction(activePost)}
                    className={`flex items-center gap-1.5 font-bold cursor-pointer px-3 py-1 rounded-full text-meta transition-all ${activePost.reactedByCurrentUser ? 'bg-brand-secondary/15 text-brand-primary' : 'bg-surface-muted text-fg-muted hover:text-brand-primary'}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> {activePost.reactionCount} Hữu ích
                  </button>
                </div>
              </div>

              <div className="space-y-4 border-t border-brand-border/60 pt-4">
                <h3 className="text-body font-extrabold text-brand-text-muted uppercase tracking-wider">Ý kiến thảo luận ({activePost.commentCount})</h3>
                {commentsLoading ? (
                  <div className="py-4 flex justify-center text-brand-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
                ) : comments.length === 0 ? (
                  <p className="text-body text-brand-text-muted font-medium py-4">Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!</p>
                ) : (
                  <div className="space-y-3.5">
                    {comments.map((c) => (
                      <div key={c.commentId} className="flex gap-3 items-start bg-surface-muted/50 border border-line-soft p-3.5 rounded-card">
                        <img src={c.authorAvatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={c.authorFullName} className="w-8 h-8 rounded-lg object-cover border border-brand-border mt-0.5" />
                        <div className="flex-1 space-y-1 text-body">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-brand-text">{c.authorFullName}</span>
                            <span className="text-meta text-fg-faint font-normal">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-brand-text-muted font-medium leading-relaxed whitespace-pre-wrap">{c.content}</p>
                          <div className="flex gap-3 pt-0.5">
                            {isMine(c.authorUserId) ? (
                              <button onClick={() => deleteComment(c)} className="text-meta font-bold text-fg-faint hover:text-danger">Xoá</button>
                            ) : (
                              <button onClick={() => setReportTarget({ type: 'COMMENT', id: c.commentId })} className="text-meta font-bold text-fg-faint hover:text-danger flex items-center gap-1">
                                <Flag className="w-3 h-3" /> Báo cáo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={submitComment} className="border-t border-brand-border/60 pt-4 mt-4 space-y-3">
              <div className="flex gap-3">
                <img src={user?.avatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={user?.fullName} className="w-9 h-9 rounded-lg object-cover border border-brand-border" />
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Nhập ý kiến thảo luận của bạn..."
                  rows={2}
                  className="flex-1 bg-surface-muted border border-brand-border rounded-card py-2 px-3 text-body text-brand-text focus:outline-none focus:border-brand-secondary resize-none font-medium placeholder-fg-faint"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={postingComment || !newComment.trim()} className="bg-brand-primary hover:bg-brand-primary-hover text-white text-body font-bold py-2 px-4.5 rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50">
                  {postingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smile className="w-3.5 h-3.5" />} <span>Trả lời</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl text-left space-y-4">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text cursor-pointer transition-all">
              <X className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-lg font-bold font-serif text-brand-text">Tạo chủ đề thảo luận mới</h3>
              <p className="text-brand-text-muted text-body font-medium">Đặt câu hỏi học thuật hoặc kêu gọi thành lập nhóm học chéo.</p>
            </div>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Tiêu đề thảo luận</label>
                <input
                  type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Xin đề mẫu môn AIL302 Practical Exam..."
                  className="w-full bg-surface-muted border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-secondary font-semibold"
                />
              </div>
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Chuyên mục (help topic)</label>
                <select
                  value={newTopicId} onChange={(e) => setNewTopicId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-primary font-semibold cursor-pointer"
                >
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.nameVi}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Nội dung chi tiết</label>
                <textarea
                  required rows={4} value={newContent} onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Mô tả cụ thể câu hỏi hoặc điều bạn cần trao đổi..."
                  className="w-full bg-surface-muted border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-secondary resize-none font-medium placeholder-fg-faint"
                />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white text-body font-bold py-3.5 px-4 rounded-full cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Đăng bài thảo luận
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-brand-border rounded-card p-6 relative shadow-2xl text-left space-y-4">
            <button onClick={() => setReportTarget(null)} className="absolute top-4 right-4 p-1.5 rounded-full bg-brand-bg hover:bg-brand-bg/85 border border-brand-border text-brand-text-muted hover:text-brand-text">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
              <Flag className="w-5 h-5 text-danger" /> Báo cáo {reportTarget.type === 'POST' ? 'bài viết' : 'bình luận'}
            </h3>
            <form onSubmit={submitReport} className="space-y-3">
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Lý do</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value as ForumReportReasonType)} className="w-full bg-brand-bg border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-primary font-semibold cursor-pointer">
                  {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-meta font-bold text-brand-text-muted uppercase mb-1.5">Mô tả thêm (tuỳ chọn)</label>
                <textarea rows={3} value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} className="w-full bg-surface-muted border border-brand-border rounded-field p-3 text-body text-brand-text focus:outline-none focus:border-brand-secondary resize-none font-medium" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setReportTarget(null)} className="text-body font-bold text-fg-muted hover:text-fg px-4 py-2.5">Huỷ</button>
                <button type="submit" disabled={reporting} className="flex items-center gap-2 bg-danger hover:opacity-90 text-white text-body font-bold py-2.5 px-5 rounded-field disabled:opacity-50">
                  {reporting && <Loader2 className="w-4 h-4 animate-spin" />} Gửi báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
