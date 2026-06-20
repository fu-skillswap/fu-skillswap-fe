// =====================================================================
// src/api/mentorVerification.ts — Mentor Verification, user side (4.6)
// =====================================================================
import { http } from './http';
import { apiClient } from './client';
import { uploadToCloudinary } from '../lib/cloudinary';
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
   * BE không nhận file thô — file được upload thẳng lên Cloudinary (unsigned)
   * trước, sau đó gửi metadata (fileUrl, publicId, sizeBytes, contentType,
   * originalFilename...) về BE để lưu vào DB, giống luồng avatar/forum.
   */
  uploadDocument: async (params: { documentType: DocumentType; file: File }) => {
    const result = await uploadToCloudinary(params.file, { resourceType: 'auto' });
    // BE mới yêu cầu: documentType, fileUrl, publicId, originalFilename, contentType, sizeBytes (KHÔNG còn isPrimary).
    return http.post<VerificationDocument>('/api/me/mentor-verification/documents', {
      documentType: params.documentType,
      fileUrl: result.fileUrl,
      publicId: result.publicId,
      sizeBytes: result.sizeBytes,
      contentType: result.contentType,
      originalFilename: result.originalFilename,
    });
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
