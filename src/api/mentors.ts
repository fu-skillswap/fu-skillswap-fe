// =====================================================================
// src/api/mentors.ts — Mentor Discovery (4.8)
// =====================================================================
import { http } from './http';
import type {
  MentorCard, MentorDetail, MentorRecommendation, MentorReview,
  MentorAvailabilitySlot, MentorSearchParams, Paged,
} from './types';

export const mentorsApi = {
  /** GET /api/mentors/recommendations?limit=8 */
  getRecommendations: (limit = 8) =>
    http.get<MentorRecommendation[]>('/api/mentors/recommendations', { params: { limit } }),

  /** GET /api/mentors — search + filter (phân trang). BE bind @ModelAttribute -> query phẳng. */
  search: (params: MentorSearchParams = {}) =>
    http.get<Paged<MentorCard>>('/api/mentors', {
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
      },
    }),

  /** GET /api/mentors/{mentorUserId} */
  getDetail: (mentorUserId: string) =>
    http.get<MentorDetail>(`/api/mentors/${mentorUserId}`),

  /** GET /api/mentors/{mentorUserId}/availability */
  getAvailability: (mentorUserId: string) =>
    http.get<MentorAvailabilitySlot[]>(`/api/mentors/${mentorUserId}/availability`),

  /** GET /api/mentors/{mentorUserId}/reviews — phân trang */
  getReviews: (mentorUserId: string, page = 0, size = 10) =>
    http.get<Paged<MentorReview>>(`/api/mentors/${mentorUserId}/reviews`, {
      params: { page, size },
    }),
};
