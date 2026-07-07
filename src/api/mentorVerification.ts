// =====================================================================
// src/api/mentorVerification.ts — Mentor Verification, user side (4.6)
// =====================================================================
import { http } from './http';
import { apiClient } from './client';
import type { VerificationRequest, VerificationDocument, TimelineEvent, DocumentType } from './types';

export const mentorVerificationApi = {
  /** POST /api/me/mentor-verification/request — khởi tạo hoặc lấy hồ sơ active */
  createOrGetRequest: () =>
    http.post<VerificationRequest>('/api/me/mentor-verification/request'),

  /** GET /api/me/mentor-verification — request hiện tại */
  getCurrent: () =>
    http.get<VerificationRequest>('/api/me/mentor-verification'),

  /** GET /api/me/mentor-verification/timeline */
  getTimeline: () =>
    http.get<TimelineEvent[]>('/api/me/mentor-verification/timeline'),

  /** GET /api/me/mentor-verification/documents/{documentId} */
  getDocument: (documentId: string) =>
    http.get<VerificationDocument>(`/api/me/mentor-verification/documents/${documentId}`),

  /**
   * POST /api/me/mentor-verification/documents
   * Nhận multipart file minh chứng, backend upload lên R2 và lưu metadata vào request hiện tại.
   */
  uploadDocument: async (params: { documentType: DocumentType; file: File }) => {
    const formData = new FormData();
    formData.append('file', params.file);
    return http.post<VerificationRequest>(
      `/api/me/mentor-verification/documents?documentType=${params.documentType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /** DELETE /api/me/mentor-verification/documents/{documentId} — xóa mềm */
  deleteDocument: (documentId: string) =>
    http.del<void>(`/api/me/mentor-verification/documents/${documentId}`),

  /** POST /api/me/mentor-verification/submit — bắt buộc termsAccepted: true */
  submit: (params: { submitNote?: string; termsAccepted: boolean }) =>
    http.post<VerificationRequest>('/api/me/mentor-verification/submit', params),

  /** POST /api/me/mentor-verification/withdraw */
  withdraw: () =>
    http.post<VerificationRequest>('/api/me/mentor-verification/withdraw'),
};

export { apiClient };
