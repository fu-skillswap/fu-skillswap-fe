// =====================================================================
// src/api/chat.ts — Conversations / Chat (gắn với booking đã accept)
// BE: /api/me/conversations. Conversation được tạo tự động khi booking
// được mentor accept, nên FE chỉ list + đọc + gửi tin, không tạo thủ công.
// =====================================================================
import { http } from './http';
import type { Conversation, ChatMessage, Paged, PageParams } from './types';

export const chatApi = {
  /** GET /api/me/conversations — inbox của user hiện tại (phân trang). */
  listConversations: (params: PageParams = {}) =>
    http.get<Paged<Conversation>>('/api/me/conversations', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
        sortBy: params.sortBy || undefined,
        direction: params.direction || undefined,
        _t: Date.now(),
      },
    }),

  /**
   * GET /api/me/conversations/{conversationId}/messages — tin nhắn của 1 thread.
   * BE trả về NEWEST-FIRST (DESC theo createdAt) -> caller cần đảo lại để hiển thị.
   */
  getMessages: (conversationId: string, params: PageParams = {}) =>
    http.get<Paged<ChatMessage>>(`/api/me/conversations/${conversationId}/messages`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
        _t: Date.now(),
      },
    }),

  /** POST /api/me/conversations/{conversationId}/messages — gửi tin nhắn text. */
  sendMessage: (conversationId: string, content: string) =>
    http.post<ChatMessage>(`/api/me/conversations/${conversationId}/messages`, { content }),

  /** GET /api/me/conversations/{conversationId} — chi tiết 1 hội thoại (BE mới). */
  getConversation: (conversationId: string) =>
    http.get<Conversation>(`/api/me/conversations/${conversationId}`),

  /** GET /api/me/conversations/unread-count — tổng tin chưa đọc (BE mới). */
  unreadCount: () =>
    http.get<{ unreadCount: number }>('/api/me/conversations/unread-count', { params: { _t: Date.now() } }),

  /** PATCH /api/me/conversations/{conversationId}/read — đánh dấu đã đọc (BE mới). */
  markRead: (conversationId: string) =>
    http.patch<void>(`/api/me/conversations/${conversationId}/read`),
};
