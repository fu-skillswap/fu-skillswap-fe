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
};
