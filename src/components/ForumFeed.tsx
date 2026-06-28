// =====================================================================
// src/components/ForumFeed.tsx — Feed diễn đàn (dữ liệu thật từ module forum).
// Đã gộp vào Trang chủ: composer mở modal tạo bài, lọc theo help-topic dạng
// pill ngang + "Chỉ bài của tôi", reaction LIKE, comment, report.
// =====================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare, ThumbsUp, Tag, X, Check, Smile, Loader2, Trash2, Flag, AlertTriangle, PenSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forumApi } from '../api/forum';
import { helpTopicApi } from '../api/mentorProfile';
import { onAvatarError } from '../lib/img';
import type {
  ForumPost, ForumComment, HelpTopic, ForumReportTargetType, ForumReportReasonType,
} from '../api/types';

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

export const ForumFeed: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const postParam = searchParams.get('post');

  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [mine, setMine] = useState(false);

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

  const openedPostParam = useRef(false);

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
        helpTopicId: selectedTopic === 'ALL' ? undefined : selectedTopic,
        mine,
        size: 30,
      });
      setPosts(res.content ?? []);
    } catch (e: any) {
      setLoadError(e?.response?.data?.message || 'Không tải được bài viết.');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, mine]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const openDetail = async (post: ForumPost) => {
    setActivePost(post);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await forumApi.listComments(post.postId);
      setComments(res.content ?? []);
    } catch { /* im lặng */ } finally {
      setCommentsLoading(false);
    }
  };

  const closeDetail = () => {
    setActivePost(null);
    if (postParam) { searchParams.delete('post'); setSearchParams(searchParams, { replace: true }); }
  };

  const patchPost = (p: ForumPost) => {
    setPosts((prev) => prev.map((x) => (x.postId === p.postId ? p : x)));
    setActivePost((cur) => (cur && cur.postId === p.postId ? p : cur));
  };

  // Deep-link ?post=<id> (từ notification) — mở sẵn bài.
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

  const openCreate = () => {
    setNewTitle(''); setNewContent('');
    if (topics.length) setNewTopicId((prev) => prev || topics[0].id);
    setShowCreateModal(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newTopicId) return;
    setCreating(true);
    try {
      await forumApi.createPost({ title: newTitle.trim(), content: newContent.trim(), helpTopicId: newTopicId });
      setShowCreateModal(false);
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
    <div className="space-y-5">
      {toast && (
        <div className={`flex items-start gap-3 p-4 rounded-field text-body font-semibold border ${toast.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.ok ? <Check className="w-4.5 h-4.5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Composer trigger -> mở modal tạo bài */}
      <div className="ss-card rounded-card p-4">
        <div className="flex items-center gap-3.5">
          {user && <img src={user.avatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={user.fullName} className="w-11 h-11 rounded-full object-cover shrink-0" />}
          <button
            onClick={openCreate}
            className="flex-1 bg-surface-muted rounded-pill py-3 px-5 text-left text-body text-fg-muted hover:opacity-80 transition-all"
          >
            Chia sẻ câu hỏi học thuật hoặc tìm bạn học chéo...
          </button>
          <button onClick={openCreate} title="Đăng bài" className="p-3 bg-action hover:bg-action-hover text-on-action rounded-field transition-all shrink-0">
            <PenSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lọc theo chuyên mục (help-topic) + chỉ bài của tôi */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none items-center">
        <button
          onClick={() => setSelectedTopic('ALL')}
          className={`px-5 py-2 rounded-pill text-body font-bold transition-all shrink-0 cursor-pointer ${selectedTopic === 'ALL' ? 'bg-action text-on-action' : 'bg-surface border border-line text-fg-muted hover:text-fg'}`}
        >
          Tất cả chủ đề
        </button>
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id)}
            className={`px-5 py-2 rounded-pill text-body font-bold transition-all shrink-0 cursor-pointer ${selectedTopic === t.id ? 'bg-action text-on-action' : 'bg-surface border border-line text-fg-muted hover:text-fg'}`}
          >
            {t.nameVi}
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-meta font-bold text-fg-muted cursor-pointer shrink-0 pl-1">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Chỉ bài của tôi
        </label>
      </div>

      {/* Danh sách bài viết */}
      <div className="space-y-4">
        {loading ? (
          <div className="ss-card py-16 flex justify-center text-fg-muted rounded-card"><Loader2 className="w-7 h-7 animate-spin" /></div>
        ) : loadError ? (
          <div className="ss-card py-12 text-center text-danger font-bold rounded-card">{loadError}</div>
        ) : posts.length === 0 ? (
          <div className="ss-card py-16 text-center text-fg-muted text-body font-semibold rounded-card">
            Chưa có bài viết nào. Hãy là người mở đầu thảo luận!
          </div>
        ) : (
          posts.map((p) => (
            <div key={p.postId} onClick={() => openDetail(p)} className="ss-card rounded-card p-5 space-y-3.5 relative cursor-pointer hover:border-line transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={p.authorAvatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={p.authorFullName} className="w-11 h-11 rounded-full object-cover border border-line" />
                  <div>
                    <span className="text-body font-bold text-fg block leading-tight">{p.authorFullName}</span>
                    <div className="flex items-center gap-1.5 mt-1 text-meta text-fg-faint font-bold">
                      <span>{timeAgo(p.createdAt)}</span>
                      {p.helpTopic && <><span>•</span><span className="text-fg-muted">{p.helpTopic.nameVi}</span></>}
                    </div>
                  </div>
                </div>
                {isMine(p.authorUserId) && (
                  <button onClick={(e) => { e.stopPropagation(); deletePost(p); }} title="Xoá bài" className="p-1.5 text-fg-faint hover:text-danger rounded-full hover:bg-surface-muted">
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-fg leading-snug">{p.title}</h3>
                <p className="text-body text-fg-muted font-medium leading-relaxed line-clamp-2">{p.content}</p>
              </div>

              <div className="flex items-center gap-2.5 pt-3.5 border-t border-line-soft">
                <button
                  onClick={(e) => toggleReaction(p, e)}
                  className={`py-2 px-4 rounded-pill text-body font-bold border transition-all cursor-pointer flex items-center gap-2 ${p.reactedByCurrentUser ? 'bg-danger/10 text-danger border-danger/20' : 'bg-surface hover:bg-surface-muted text-fg-muted border-line'}`}
                >
                  <ThumbsUp className={`w-4.5 h-4.5 ${p.reactedByCurrentUser ? 'fill-current' : ''}`} />
                  <span>{p.reactionCount}</span>
                </button>
                <button className="py-2 px-4 bg-surface hover:bg-surface-muted border border-line rounded-pill text-body font-bold text-fg-muted cursor-pointer transition-all flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5" /><span>{p.commentCount}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal chi tiết */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-card p-6 relative shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-left">
            <button onClick={closeDetail} className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-muted hover:opacity-80 border border-line text-fg-muted hover:text-fg cursor-pointer z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="overflow-y-auto space-y-6 flex-1 pr-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <img src={activePost.authorAvatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={activePost.authorFullName} className="w-9 h-9 rounded-lg border border-line object-cover" />
                  <div>
                    <span className="font-bold text-fg block">{activePost.authorFullName}</span>
                    <span className="text-meta text-fg-faint font-semibold block">Đăng {timeAgo(activePost.createdAt)}</span>
                  </div>
                  <button onClick={() => setReportTarget({ type: 'POST', id: activePost.postId })} className="ml-auto mr-8 flex items-center gap-1 text-meta font-bold text-fg-faint hover:text-danger">
                    <Flag className="w-3.5 h-3.5" /> Báo cáo
                  </button>
                </div>

                <h2 className="text-xl font-bold text-fg leading-snug">{activePost.title}</h2>
                <p className="text-body text-fg font-medium leading-relaxed bg-surface-muted border border-line p-4 rounded-card whitespace-pre-wrap">{activePost.content}</p>

                <div className="flex items-center gap-3">
                  {activePost.helpTopic && (
                    <span className="inline-flex items-center gap-1 text-meta bg-surface-muted border border-line text-fg-muted font-bold py-0.5 px-2 rounded-md"><Tag className="w-3 h-3" /> {activePost.helpTopic.nameVi}</span>
                  )}
                  <button
                    onClick={() => toggleReaction(activePost)}
                    className={`flex items-center gap-1.5 font-bold cursor-pointer px-3 py-1 rounded-pill text-meta transition-all ${activePost.reactedByCurrentUser ? 'bg-danger/10 text-danger' : 'bg-surface-muted text-fg-muted hover:text-fg'}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> {activePost.reactionCount}
                  </button>
                </div>
              </div>

              <div className="space-y-4 border-t border-line-soft pt-4">
                <h3 className="text-body font-extrabold text-fg-muted uppercase tracking-wider">Bình luận ({activePost.commentCount})</h3>
                {commentsLoading ? (
                  <div className="py-4 flex justify-center text-fg-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
                ) : comments.length === 0 ? (
                  <p className="text-body text-fg-muted font-medium py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                  <div className="space-y-3.5">
                    {comments.map((c) => (
                      <div key={c.commentId} className="flex gap-3 items-start bg-surface-muted/50 border border-line-soft p-3.5 rounded-card">
                        <img src={c.authorAvatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={c.authorFullName} className="w-8 h-8 rounded-lg object-cover border border-line mt-0.5" />
                        <div className="flex-1 space-y-1 text-body">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-fg">{c.authorFullName}</span>
                            <span className="text-meta text-fg-faint font-normal">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-fg-muted font-medium leading-relaxed whitespace-pre-wrap">{c.content}</p>
                          <div className="flex gap-3 pt-0.5">
                            {isMine(c.authorUserId) ? (
                              <button onClick={() => deleteComment(c)} className="text-meta font-bold text-fg-faint hover:text-danger">Xoá</button>
                            ) : (
                              <button onClick={() => setReportTarget({ type: 'COMMENT', id: c.commentId })} className="text-meta font-bold text-fg-faint hover:text-danger flex items-center gap-1"><Flag className="w-3 h-3" /> Báo cáo</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={submitComment} className="border-t border-line-soft pt-4 mt-4 space-y-3">
              <div className="flex gap-3">
                <img src={user?.avatarUrl || AVA_FALLBACK} onError={onAvatarError} alt={user?.fullName} className="w-9 h-9 rounded-lg object-cover border border-line" />
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Nhập bình luận..." rows={2} className="flex-1 bg-surface-muted border border-line rounded-card py-2 px-3 text-body text-fg focus:outline-none focus:border-primary resize-none font-medium placeholder-fg-faint" />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={postingComment || !newComment.trim()} className="bg-action hover:bg-action-hover text-on-action text-body font-bold py-2 px-4.5 rounded-pill cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50">
                  {postingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smile className="w-3.5 h-3.5" />} <span>Trả lời</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal tạo bài */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface border border-line rounded-card p-6 relative shadow-2xl text-left space-y-4">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-muted hover:opacity-80 border border-line text-fg-muted hover:text-fg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-fg">Tạo bài thảo luận</h3>
              <p className="text-fg-muted text-body font-medium">Đặt câu hỏi học thuật hoặc kêu gọi học nhóm chéo.</p>
            </div>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Tiêu đề</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ví dụ: Xin đề mẫu môn AIL302..." className="w-full bg-surface-muted border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary font-semibold" />
              </div>
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Chuyên mục</label>
                <select value={newTopicId} onChange={(e) => setNewTopicId(e.target.value)} className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary font-semibold cursor-pointer">
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.nameVi}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Nội dung</label>
                <textarea required rows={4} value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Mô tả cụ thể câu hỏi hoặc điều bạn cần trao đổi..." className="w-full bg-surface-muted border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary resize-none font-medium placeholder-fg-faint" />
              </div>
              <button type="submit" disabled={creating} className="w-full bg-action hover:bg-action-hover text-on-action text-body font-bold py-3.5 px-4 rounded-pill cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Đăng bài
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal báo cáo */}
      {reportTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 relative shadow-2xl text-left space-y-4">
            <button onClick={() => setReportTarget(null)} className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-muted hover:opacity-80 border border-line text-fg-muted hover:text-fg">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-fg flex items-center gap-2"><Flag className="w-5 h-5 text-danger" /> Báo cáo {reportTarget.type === 'POST' ? 'bài viết' : 'bình luận'}</h3>
            <form onSubmit={submitReport} className="space-y-3">
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Lý do</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value as ForumReportReasonType)} className="w-full bg-surface border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary font-semibold cursor-pointer">
                  {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-meta font-bold text-fg-muted uppercase mb-1.5">Mô tả thêm (tuỳ chọn)</label>
                <textarea rows={3} value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} className="w-full bg-surface-muted border border-line rounded-field p-3 text-body text-fg focus:outline-none focus:border-primary resize-none font-medium" />
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
