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
   * POST /api/me/mentor-verification/documents — multipart upload.
   * Không tự set Content-Type: để browser tự sinh boundary của multipart/form-data.
   */
  uploadDocument: (params: { documentType: DocumentType; isPrimary: boolean; file: File }) => {
    const form = new FormData();
    form.append('documentType', params.documentType);
    form.append('isPrimary', String(params.isPrimary));
    form.append('sizeBytes', String(params.file.size));
    form.append('contentType', params.file.type || 'application/octet-stream');
    form.append('originalFilename', params.file.name);
    form.append('file', params.file);
    return http.post<VerificationDocument>('/api/me/mentor-verification/documents', form);
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
