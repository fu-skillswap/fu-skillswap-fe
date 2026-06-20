// =====================================================================
// src/api/adminUsers.ts — System users + admin moderation
// =====================================================================
import { http } from './http';
import type { SystemUser, AdminMentorListItem, Paged, PageParams } from './types';

export const adminUsersApi = {
  /** GET /api/system/users — toàn bộ user (phân trang) */
  listUsers: (params: PageParams = {}) =>
    http.get<Paged<SystemUser>>('/api/system/users', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
        sortBy: params.sortBy || undefined,
        direction: params.direction || undefined,
      },
    }),

  /** POST /api/admin/users/{userId}/ban */
  ban: (userId: string, reason: string) =>
    http.post<SystemUser>(`/api/admin/users/${userId}/ban`, { reason }),

  /** POST /api/admin/users/{userId}/unban */
  unban: (userId: string, reason?: string) =>
    http.post<SystemUser>(`/api/admin/users/${userId}/unban`, { reason }),

  /** GET /api/admin/mentors — danh sách mentor cho admin (phân trang) */
  listMentors: (params: PageParams & { keyword?: string; status?: string; isAvailable?: boolean } = {}) =>
    http.get<Paged<AdminMentorListItem>>('/api/admin/mentors', {
      params: {
        keyword: params.keyword || undefined,
        status: params.status || undefined,
        isAvailable: typeof params.isAvailable === 'boolean' ? params.isAvailable : undefined,
        page: params.page ?? 0,
        size: params.size ?? 50,
        sortBy: params.sortBy || undefined,
        direction: params.direction || undefined,
      },
    }),
};
