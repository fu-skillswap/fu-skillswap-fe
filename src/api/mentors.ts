// =====================================================================
// src/api/mentors.ts — Mentor Discovery (4.8)
// =====================================================================
import { http } from './http';
import type { MentorCardDto, MentorDetailDto, AvailabilitySlot, MentorSearchParams, Paged } from './types';

export const mentorsApi = {
  /** GET /api/mentors/recommendations?limit=8 */
  getRecommendations: (limit = 8) =>
    http.get<MentorCardDto[]>('/api/mentors/recommendations', { params: { limit } }),

  /** GET /api/mentors — search + filter (phân trang) */
  search: (params: MentorSearchParams = {}) =>
    http.get<Paged<MentorCardDto>>('/api/mentors', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 12,
        sortBy: params.sortBy ?? 'relevance',
        direction: params.direction ?? 'DESC',
        keyword: params.keyword || undefined,
        // axios serialize mảng -> tagIds=a&tagIds=b
        tagIds: params.tagIds && params.tagIds.length ? params.tagIds : undefined,
        campusId: params.campusId || undefined,
        specializationId: params.specializationId || undefined,
        teachingMode: params.teachingMode || undefined,
        isAvailable: typeof params.isAvailable === 'boolean' ? params.isAvailable : undefined,
      },
    }),

  /** GET /api/mentors/{mentorUserId} */
  getDetail: (mentorUserId: string) =>
    http.get<MentorDetailDto>(`/api/mentors/${mentorUserId}`),

  /** GET /api/mentors/{mentorUserId}/availability */
  getAvailability: (mentorUserId: string) =>
    http.get<AvailabilitySlot[]>(`/api/mentors/${mentorUserId}/availability`),
};
