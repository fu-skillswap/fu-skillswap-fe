import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, BellOff } from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import type { NotificationItem } from '../api/types';

/** Thời gian tương đối ngắn gọn cho item thông báo. */
const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

/** Suy ra đường dẫn deep-link từ loại thông báo / entity liên quan. */
const linkFor = (n: NotificationItem): string | null => {
  if (n.relatedEntityType === 'BOOKING') return '/bookings';
  if (n.type?.startsWith('MENTOR_VERIFICATION')) return '/profile';
  if (n.type === 'FEEDBACK_RECEIVED' || n.type === 'SESSION_COMPLETED') return '/bookings';
  if (n.type?.startsWith('BOOKING')) return '/bookings';
  return null;
};

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadUnread = useCallback(async () => {
    try {
      const res = await notificationsApi.unreadCount();
      setUnread(res?.unreadCount ?? 0);
    } catch {
      /* im lặng: badge không chặn UI */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ size: 20 });
      setItems(res.content ?? []);
    } catch (e) {
      console.error('Lỗi tải thông báo:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Badge: tải lần đầu + poll mỗi 30s.
  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 30000);
    return () => clearInterval(t);
  }, [loadUnread]);

  // Đóng khi click ra ngoài.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const handleItemClick = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.read) {
      // Optimistic: giảm badge + đánh dấu đã đọc.
      setItems((prev) => prev.map((it) => (it.notificationId === n.notificationId ? { ...it, read: true } : it)));
      setUnread((c) => Math.max(0, c - 1));
      notificationsApi.markAsRead(n.notificationId).catch(() => loadUnread());
    }
    const path = linkFor(n);
    if (path) navigate(path);
  };

  const handleMarkAll = async () => {
    if (markingAll || unread === 0) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    setUnread(0);
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      loadUnread();
    } finally {
      setMarkingAll(false);
    }
  };

  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        title="Thông báo"
        className="p-2.5 bg-surface border border-line text-fg-muted hover:text-fg rounded-full transition-all relative cursor-pointer focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold border-2 border-surface leading-none">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-line rounded-card shadow-xl z-50 text-left animate-fadeIn overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line-soft">
            <span className="text-body font-bold text-fg">Thông báo</span>
            <button
              onClick={handleMarkAll}
              disabled={unread === 0 || markingAll}
              className="flex items-center gap-1 text-meta font-semibold text-primary hover:text-primary-hover disabled:text-fg-faint disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              <span>Đọc tất cả</span>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-10 flex flex-col items-center gap-2 text-fg-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-meta font-semibold">Đang tải...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-brand-text-muted">
                <BellOff className="w-7 h-7 text-fg-faint" />
                <span className="text-meta font-semibold">Chưa có thông báo nào.</span>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.notificationId}
                  onClick={() => handleItemClick(n)}
                  className={`w-full flex gap-3 px-4 py-3 text-left border-b border-line-soft last:border-0 transition-colors cursor-pointer hover:bg-surface-muted ${
                    n.read ? '' : 'bg-primary/5'
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-primary'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-body truncate ${n.read ? 'font-semibold text-fg-muted' : 'font-bold text-fg'}`}>
                        {n.title}
                      </span>
                      <span className="text-meta text-fg-faint font-semibold shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-meta text-brand-text-muted font-medium leading-snug mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
