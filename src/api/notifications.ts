// =====================================================================
// src/api/notifications.ts — In-app notifications của user hiện tại.
// BE: /api/me/notifications (list + unread-count + mark read/read-all).
// =====================================================================
import { http } from './http';
import type { NotificationItem, Paged, PageParams } from './types';

interface UnreadCountResponse {
  unreadCount: number;
}

export const notificationsApi = {
  /** GET /api/me/notifications — danh sách thông báo (phân trang). */
  list: (params: PageParams & { unreadOnly?: boolean } = {}) =>
    http.get<Paged<NotificationItem>>('/api/me/notifications', {
      params: {
        unreadOnly: params.unreadOnly ?? false,
        page: params.page ?? 0,
        size: params.size ?? 20,
        _t: Date.now(),
      },
    }),

  /** GET /api/me/notifications/unread-count — số chưa đọc (cho badge). */
  unreadCount: () =>
    http.get<UnreadCountResponse>('/api/me/notifications/unread-count', { params: { _t: Date.now() } }),

  /** PUT /api/me/notifications/{id}/read — đánh dấu 1 thông báo đã đọc. */
  markAsRead: (id: string) => http.put<void>(`/api/me/notifications/${id}/read`),

  /** PUT /api/me/notifications/read-all — đánh dấu tất cả đã đọc. */
  markAllAsRead: () => http.put<void>('/api/me/notifications/read-all'),
};
