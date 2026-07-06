// =====================================================================
// src/api/mentors.ts — Mentor Discovery (4.8)
// =====================================================================
import { http } from './http';
import type {
  MentorCard, MentorDetail, MentorRecommendation, MentorReview,
  MentorAvailabilitySlot, MentorSearchParams, ServiceSlotCandidates, Paged,
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
      },
    }),

  /** GET /api/mentors/{mentorUserId} */
  getDetail: (mentorUserId: string) =>
    http.get<MentorDetail>(`/api/mentors/${mentorUserId}`),

  /**
   * GET /api/mentors/{mentorUserId}/availability-slots — parent slots kèm services gắn vào.
   * Đây là API mới dùng cho luồng đặt lịch (mỗi slot có danh sách service để mentee chọn).
   */
  getAvailabilitySlots: (mentorUserId: string, fromDate?: string, toDate?: string) =>
    http.get<MentorAvailabilitySlot[]>(`/api/mentors/${mentorUserId}/availability-slots`, {
      params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
    }),

  /**
   * GET /api/mentors/{mentorUserId}/availability-slots/{slotId}/candidates?serviceId=...
   * Trả về các khung giờ chính xác (candidate) đặt được cho service trong slot.
   */
  getSlotCandidates: (mentorUserId: string, slotId: string, serviceId: string) =>
    http.get<ServiceSlotCandidates>(
      `/api/mentors/${mentorUserId}/availability-slots/${slotId}/candidates`,
      { params: { serviceId } },
    ),

  /** GET /api/mentors/{mentorUserId}/availability — (cũ) danh sách slot đơn giản, giữ tương thích. */
  getAvailability: (mentorUserId: string) =>
    http.get<MentorAvailabilitySlot[]>(`/api/mentors/${mentorUserId}/availability`),

  /** GET /api/mentors/{mentorUserId}/reviews — phân trang */
  getReviews: (mentorUserId: string, page = 0, size = 10) =>
    http.get<Paged<MentorReview>>(`/api/mentors/${mentorUserId}/reviews`, {
      params: { page, size },
    }),
};
