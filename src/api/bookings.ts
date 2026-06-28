// =====================================================================
// src/api/bookings.ts — Booking lifecycle (mentee đặt + mentor xử lý) (4.9/4.10)
// =====================================================================
import { http } from './http';
import type {
  Booking, CreateBookingPayload, SubmitFeedbackPayload, MyBookingsParams,
  SubmitBookingIssuePayload, BookingIssueResult, MeetingPlatform, Paged,
  CreateBookingRescheduleRequest, RespondBookingRescheduleRequest, BookingRescheduleRequestResponse,
} from './types';

export const bookingsApi = {
  /** POST /api/bookings — mentee tạo yêu cầu đặt lịch */
  create: (payload: CreateBookingPayload) =>
    http.post<Booking>('/api/bookings', payload),

  /** GET /api/me/bookings — danh sách booking của tôi (lọc theo role/status) */
  listMine: (params: MyBookingsParams = {}) =>
    http.get<Paged<Booking>>('/api/me/bookings', {
      params: {
        role: params.role || undefined,
        status: params.status || undefined,
        page: params.page ?? 0,
        size: params.size ?? 50,
        sortBy: params.sortBy || undefined,
        direction: params.direction || undefined,
      },
    }),

  /** GET /api/me/bookings/{bookingId} */
  getById: (bookingId: string) =>
    http.get<Booking>(`/api/me/bookings/${bookingId}`),

  /** POST /api/me/bookings/{bookingId}/cancel — mentee huỷ */
  cancel: (bookingId: string, cancelReason: string) =>
    http.post<Booking>(`/api/me/bookings/${bookingId}/cancel`, { cancelReason }),

  /** POST /api/me/bookings/{bookingId}/complete — đánh dấu buổi đã hoàn tất */
  complete: (bookingId: string, completionNote?: string) =>
    http.post<Booking>(`/api/me/bookings/${bookingId}/complete`, { completionNote }),

  /**
   * POST /api/me/bookings/{bookingId}/confirm — mentee xác nhận buổi đã diễn ra ổn
   * (AWAITING_MENTEE_CONFIRMATION -> COMPLETED).
   */
  confirm: (bookingId: string, confirmationNote?: string) =>
    http.post<Booking>(`/api/me/bookings/${bookingId}/confirm`, { confirmationNote }),

  /** POST /api/me/bookings/{bookingId}/issue — mentee báo sự cố sau buổi học (-> UNDER_REVIEW). */
  submitIssue: (bookingId: string, payload: SubmitBookingIssuePayload) =>
    http.post<BookingIssueResult>(`/api/me/bookings/${bookingId}/issue`, payload),

  /** POST /api/bookings/{bookingId}/feedback — mentee gửi đánh giá sau buổi học */
  submitFeedback: (bookingId: string, payload: SubmitFeedbackPayload) =>
    http.post<unknown>(`/api/bookings/${bookingId}/feedback`, payload),

  // -------------------- reschedule (mentee side) --------------------
  /** GET /api/me/bookings/{bookingId}/reschedule-requests */
  listRescheduleRequests: (bookingId: string) =>
    http.get<BookingRescheduleRequestResponse[]>(`/api/me/bookings/${bookingId}/reschedule-requests`),

  /** POST /api/me/bookings/{bookingId}/reschedule-requests */
  createRescheduleRequest: (bookingId: string, payload: CreateBookingRescheduleRequest) =>
    http.post<BookingRescheduleRequestResponse>(`/api/me/bookings/${bookingId}/reschedule-requests`, payload),

  /** POST /api/me/bookings/reschedule-requests/{requestId}/accept */
  acceptRescheduleRequest: (requestId: string, payload: RespondBookingRescheduleRequest) =>
    http.post<BookingRescheduleRequestResponse>(`/api/me/bookings/reschedule-requests/${requestId}/accept`, payload),

  /** POST /api/me/bookings/reschedule-requests/{requestId}/reject */
  rejectRescheduleRequest: (requestId: string, payload: RespondBookingRescheduleRequest) =>
    http.post<BookingRescheduleRequestResponse>(`/api/me/bookings/reschedule-requests/${requestId}/reject`, payload),

  // -------------------- mentor side --------------------
  /** POST /api/mentor/bookings/{bookingId}/accept */
  accept: (bookingId: string, mentorResponseNote?: string) =>
    http.post<Booking>(`/api/mentor/bookings/${bookingId}/accept`, { mentorResponseNote }),

  /** POST /api/mentor/bookings/{bookingId}/reject */
  reject: (bookingId: string, rejectReason: string, mentorResponseNote?: string) =>
    http.post<Booking>(`/api/mentor/bookings/${bookingId}/reject`, { rejectReason, mentorResponseNote }),

  /** POST /api/mentor/bookings/{bookingId}/cancel — mentor huỷ buổi đã nhận */
  mentorCancel: (bookingId: string, cancelReason: string) =>
    http.post<Booking>(`/api/mentor/bookings/${bookingId}/cancel`, { cancelReason }),

  /**
   * POST /api/mentor/bookings/{bookingId}/complete — mentor báo đã dạy xong
   * (-> AWAITING_MENTEE_CONFIRMATION).
   */
  mentorComplete: (bookingId: string, completionNote?: string) =>
    http.post<Booking>(`/api/mentor/bookings/${bookingId}/complete`, { completionNote }),

  /** PATCH /api/mentor/bookings/{bookingId}/meeting-link — gắn link/địa điểm họp */
  saveMeetingLink: (
    bookingId: string,
    body: { meetingPlatform: MeetingPlatform; meetingLink?: string; location?: string },
  ) => http.patch<Booking>(`/api/mentor/bookings/${bookingId}/meeting-link`, body),

  // -------------------- reschedule (mentor side) --------------------
  /** POST /api/mentor/bookings/{bookingId}/reschedule-requests */
  mentorCreateRescheduleRequest: (bookingId: string, payload: CreateBookingRescheduleRequest) =>
    http.post<BookingRescheduleRequestResponse>(`/api/mentor/bookings/${bookingId}/reschedule-requests`, payload),

  /** POST /api/mentor/bookings/reschedule-requests/{requestId}/accept */
  mentorAcceptRescheduleRequest: (requestId: string, payload: RespondBookingRescheduleRequest) =>
    http.post<BookingRescheduleRequestResponse>(`/api/mentor/bookings/reschedule-requests/${requestId}/accept`, payload),

  /** POST /api/mentor/bookings/reschedule-requests/{requestId}/reject */
  mentorRejectRescheduleRequest: (requestId: string, payload: RespondBookingRescheduleRequest) =>
    http.post<BookingRescheduleRequestResponse>(`/api/mentor/bookings/reschedule-requests/${requestId}/reject`, payload),
};
