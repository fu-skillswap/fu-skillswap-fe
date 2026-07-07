import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCheck, Loader2, BellOff, X, CheckCircle2, AlertTriangle, BellRing 
} from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import { chatSocket } from '../lib/chatSocket';
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
  // Ưu tiên deepLink BE trả, nhưng chuẩn hoá về route FE thực có
  // (FE chưa có /bookings/:id nên gộp về /bookings).
  const dl = n.deepLink?.trim();
  if (dl) {
    if (dl.startsWith('/bookings')) return '/bookings';
    if (dl.startsWith('/forum') || dl.startsWith('/profile') || dl.startsWith('/chat')
        || dl.startsWith('/mentors') || dl.startsWith('/dashboard') || dl.startsWith('/admin')) {
      return dl;
    }
    // Path lạ -> rơi xuống heuristic bên dưới.
  }
  if (n.relatedEntityType === 'BOOKING') return '/bookings';
  // Forum: mở thẳng bài viết liên quan nếu có postId (/forum render Dashboard đã gộp).
  if (n.relatedEntityType === 'FORUM_POST' && n.relatedEntityId) return `/forum?post=${n.relatedEntityId}`;
  if (n.type?.startsWith('FORUM')) return '/forum';
  if (n.type?.startsWith('MENTOR_VERIFICATION') || n.type === 'ACCOUNT_UNLOCKED') return '/profile';
  if (n.type === 'FEEDBACK_RECEIVED' || n.type === 'SESSION_COMPLETED') return '/bookings';
  // Bao gồm cả BOOKING_RESCHEDULE_* / BOOKING_REQUEST_EXPIRED (type bắt đầu bằng BOOKING).
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
  
  // State quản lý danh sách Toasts đang hiển thị ở góc màn hình
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  const ref = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Đóng toast cụ thể
  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.notificationId !== id));
  }, []);

  // Xử lý khi nhận được thông báo mới (cả từ WebSocket và Polling)
  const handleIncomingNotification = useCallback((n: NotificationItem) => {
    if (knownIdsRef.current.has(n.notificationId)) return;
    
    // Lưu ID để tránh trùng lặp
    knownIdsRef.current.add(n.notificationId);

    // Thêm vào danh sách thông báo hiển thị ở quả chuông (tối đa 20)
    setItems((prev) => {
      if (prev.some((item) => item.notificationId === n.notificationId)) return prev;
      return [n, ...prev].slice(0, 20);
    });

    // Chỉ đếm và báo Toast cho các thông báo chưa đọc
    if (!n.read) {
      setUnread((c) => c + 1);
      
      // Bắn Toast thông báo nổi
      setToasts((prev) => {
        if (prev.some((t) => t.notificationId === n.notificationId)) return prev;
        return [...prev, n];
      });

      // Tự động đóng sau 5 giây
      setTimeout(() => {
        closeToast(n.notificationId);
      }, 5000);
    }
  }, [closeToast]);

  // Hàm tải thông tin từ API (vừa dùng để đồng bộ vừa làm polling fallback)
  const pollNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ size: 10 });
      const newItems = res.content ?? [];

      if (isInitialLoadRef.current) {
        // Lần đầu tải trang: lưu toàn bộ ID hiện tại vào set để không bắn Toast thông báo cũ
        newItems.forEach((n) => knownIdsRef.current.add(n.notificationId));
        setItems(newItems);
        isInitialLoadRef.current = false;

        // Fetch số chưa đọc chuẩn xác nhất
        const countRes = await notificationsApi.unreadCount();
        setUnread(countRes?.unreadCount ?? 0);
      } else {
        // Các lần poll sau: Duyệt từ cũ đến mới để hiển thị Toast theo đúng thứ tự thời gian
        const reversed = [...newItems].reverse();
        reversed.forEach((n) => {
          if (!knownIdsRef.current.has(n.notificationId)) {
            handleIncomingNotification(n);
          }
        });
      }
    } catch (e) {
      console.error('Lỗi poll thông báo:', e);
    }
  }, [handleIncomingNotification]);

  // Khởi tạo và thiết lập lắng nghe
  useEffect(() => {
    // 1. Kích hoạt kết nối WebSocket toàn cục
    chatSocket.connect();

    // 2. Lắng nghe qua kênh STOMP
    const unsubscribeWs = chatSocket.onNotification((n) => {
      handleIncomingNotification(n);
    });

    // 3. Thực hiện tải lần đầu và lập lịch poll mỗi 20 giây
    pollNotifications();
    const timer = setInterval(pollNotifications, 20000);

    return () => {
      unsubscribeWs();
      clearInterval(timer);
    };
  }, [pollNotifications, handleIncomingNotification]);

  // Tải lại toàn bộ danh sách khi mở quả chuông
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const [res, countRes] = await Promise.all([
        notificationsApi.list({ size: 20 }),
        notificationsApi.unreadCount(),
      ]);
      const currentItems = res.content ?? [];
      setItems(currentItems);
      setUnread(countRes?.unreadCount ?? 0);
      
      // Đảm bảo đồng bộ hóa ID đã biết
      currentItems.forEach((n) => knownIdsRef.current.add(n.notificationId));
    } catch (e) {
      console.error('Lỗi tải danh sách thông báo:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lắng nghe sự kiện để kích hoạt toast hoặc tải lại từ các component khác
  useEffect(() => {
    const handleRefresh = () => {
      pollNotifications();
      loadList();
    };

    const handlePushToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; message: string; type?: string }>;
      if (customEvent.detail) {
        const { title, message, type } = customEvent.detail;
        const fakeNotification: NotificationItem = {
          notificationId: `toast-${Date.now()}-${Math.random()}`,
          type: type || 'INFO',
          title,
          message,
          read: false,
          createdAt: new Date().toISOString()
        };
        
        setToasts((prev) => {
          if (prev.some((t) => t.notificationId === fakeNotification.notificationId)) return prev;
          return [...prev, fakeNotification];
        });

        // Thêm vào danh sách thông báo hiển thị ở quả chuông
        setItems((prev) => {
          if (prev.some((item) => item.notificationId === fakeNotification.notificationId)) return prev;
          return [fakeNotification, ...prev].slice(0, 20);
        });

        // Tăng số thông báo chưa đọc
        setUnread((c) => c + 1);

        setTimeout(() => {
          closeToast(fakeNotification.notificationId);
        }, 5000);
      }
    };

    window.addEventListener('refresh-notifications', handleRefresh);
    window.addEventListener('push-toast', handlePushToast);

    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh);
      window.removeEventListener('push-toast', handlePushToast);
    };
  }, [pollNotifications, loadList, closeToast]);

  // Đóng khi click ra ngoài quả chuông
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

  const handleItemClick = useCallback(async (n: NotificationItem) => {
    setOpen(false);
    if (!n.read) {
      // Cập nhật giao diện lạc quan (optimistic UI update)
      setItems((prev) => prev.map((it) => (it.notificationId === n.notificationId ? { ...it, read: true } : it)));
      setUnread((c) => Math.max(0, c - 1));
      
      // Chỉ gửi PATCH lên backend nếu không phải là thông báo ảo từ UI
      if (n.notificationId && !n.notificationId.startsWith('toast-')) {
        notificationsApi.markAsRead(n.notificationId).catch((err) => {
          console.error('Lỗi đánh dấu đã đọc:', err);
          pollNotifications();
        });
      }
    }
    const path = linkFor(n);
    if (path) navigate(path);
  }, [navigate, pollNotifications]);

  // Click vào Toast
  const handleToastClick = useCallback((n: NotificationItem) => {
    closeToast(n.notificationId);
    handleItemClick(n);
  }, [closeToast, handleItemClick]);

  const handleMarkAll = async () => {
    if (markingAll || unread === 0) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    setUnread(0);
    try {
      await notificationsApi.markAllAsRead();
    } catch (e) {
      console.error('Lỗi đọc tất cả:', e);
      pollNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <div className="relative" ref={ref}>
      {/* Icon quả chuông */}
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

      {/* Menu dropdown chứa danh sách thông báo */}
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

      {/* Danh sách các Banner Toast nổi ở góc phải màn hình */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let Icon = BellRing;
          let iconColor = 'text-primary';
          let borderColor = 'border-line';

          if (t.type === 'BOOKING_ACCEPTED' || t.type?.endsWith('APPROVED')) {
            Icon = CheckCircle2;
            iconColor = 'text-success';
            borderColor = 'border-success/20';
          } else if (
            t.type === 'BOOKING_REJECTED' || 
            t.type?.endsWith('REJECTED') || 
            t.type?.includes('CANCELLED') ||
            t.type?.includes('FAIL')
          ) {
            Icon = AlertTriangle;
            iconColor = 'text-danger';
            borderColor = 'border-danger/20';
          }

          return (
            <div
              key={t.notificationId}
              onClick={() => handleToastClick(t)}
              className={`bg-surface border ${borderColor} rounded-card shadow-2xl p-4 flex items-start gap-3 pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-card animate-fadeIn`}
            >
              <div className={`p-1.5 rounded-lg bg-surface-muted shrink-0 ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-body font-extrabold text-fg leading-tight truncate">{t.title}</h4>
                <p className="text-meta text-fg-muted font-medium mt-1 leading-snug line-clamp-2">{t.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeToast(t.notificationId);
                }}
                className="p-1 rounded-full text-fg-faint hover:text-fg hover:bg-surface-muted transition-all shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
