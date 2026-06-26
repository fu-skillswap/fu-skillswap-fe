// =====================================================================
// src/api/forum.ts — Diễn đàn thảo luận (module forum BE mới).
// BE: /api/forum/posts (+ comments, reaction) và /api/forum/reports.
// helpTopicId dùng chung danh mục /api/catalog/help-topics.
// =====================================================================
import { http } from './http';
import type {
  ForumPost, ForumComment, ForumPostPayload, ForumReportPayload, ForumReactionType, Paged,
} from './types';

interface ListPostsParams {
  page?: number;
  size?: number;
  keyword?: string;
  helpTopicId?: string;
  mine?: boolean;
}

export const forumApi = {
  /** GET /api/forum/posts — danh sách bài viết (mới nhất trước). */
  listPosts: (params: ListPostsParams = {}) =>
    http.get<Paged<ForumPost>>('/api/forum/posts', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        keyword: params.keyword?.trim() || undefined,
        helpTopicId: params.helpTopicId || undefined,
        mine: params.mine ?? false,
        _t: Date.now(),
      },
    }),

  /** GET /api/forum/posts/{postId} — chi tiết bài viết. */
  getPost: (postId: string) => http.get<ForumPost>(`/api/forum/posts/${postId}`),

  /** POST /api/forum/posts — tạo bài viết. */
  createPost: (payload: ForumPostPayload) => http.post<ForumPost>('/api/forum/posts', payload),

  /** PUT /api/forum/posts/{postId} — cập nhật bài viết của tôi. */
  updatePost: (postId: string, payload: ForumPostPayload) =>
    http.put<ForumPost>(`/api/forum/posts/${postId}`, payload),

  /** DELETE /api/forum/posts/{postId} — xoá mềm bài viết của tôi. */
  deletePost: (postId: string) => http.del<void>(`/api/forum/posts/${postId}`),

  /** GET /api/forum/posts/{postId}/comments — comment (cũ nhất trước). */
  listComments: (postId: string, params: { page?: number; size?: number } = {}) =>
    http.get<Paged<ForumComment>>(`/api/forum/posts/${postId}/comments`, {
      params: { page: params.page ?? 0, size: params.size ?? 50, _t: Date.now() },
    }),

  /** POST /api/forum/posts/{postId}/comments — thêm comment. */
  createComment: (postId: string, content: string) =>
    http.post<ForumComment>(`/api/forum/posts/${postId}/comments`, { content }),

  /** DELETE /api/forum/comments/{commentId} — xoá mềm comment của tôi. */
  deleteComment: (commentId: string) => http.del<void>(`/api/forum/comments/${commentId}`),

  /** PUT /api/forum/posts/{postId}/reaction — thả reaction (mặc định LIKE). */
  react: (postId: string, reactionType: ForumReactionType = 'LIKE') =>
    http.put<ForumPost>(`/api/forum/posts/${postId}/reaction`, { reactionType }),

  /** DELETE /api/forum/posts/{postId}/reaction — bỏ reaction. */
  unreact: (postId: string) => http.del<ForumPost>(`/api/forum/posts/${postId}/reaction`),

  /** POST /api/forum/reports — báo cáo post/comment. */
  report: (payload: ForumReportPayload) => http.post<unknown>('/api/forum/reports', payload),
};
