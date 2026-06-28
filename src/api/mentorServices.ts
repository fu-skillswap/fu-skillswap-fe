// =====================================================================
// src/api/mentorServices.ts — Mentor Services / Sessions Management (4.7)
// =====================================================================
import { http } from './http';
import type { MentorServiceItem } from './types';

export interface MentorServicePayload {
  title: string;
  description: string;
  /** Kết quả kỳ vọng — BE bắt buộc (@NotBlank), gửi riêng ngoài description. */
  expectedOutcome: string;
  durationMinutes: number;
  isFree: boolean;
  /** Giá theo SCoin (BE mới). BE yêu cầu @NotNull; gửi 0 khi miễn phí. */
  priceScoin: number;
  helpTopicIds: string[];
  active?: boolean;
}

export const mentorServicesApi = {
  /** GET /api/me/mentor-services — Lấy danh sách dịch vụ/session của mentor hiện tại */
  list: () => http.get<MentorServiceItem[]>('/api/me/mentor-services', { params: { _t: Date.now() } }),

  /** GET /api/me/mentor-services/{serviceId} — Chi tiết dịch vụ/session của mentor hiện tại */
  getDetail: (serviceId: string) => 
    http.get<MentorServiceItem>(`/api/me/mentor-services/${serviceId}`),

  /** POST /api/me/mentor-services — Tạo mới dịch vụ/session */
  create: (payload: MentorServicePayload) => 
    http.post<MentorServiceItem>('/api/me/mentor-services', payload),

  /** PUT /api/me/mentor-services/{serviceId} — Cập nhật thông tin dịch vụ */
  update: (serviceId: string, payload: Partial<MentorServicePayload>) => 
    http.put<MentorServiceItem>(`/api/me/mentor-services/${serviceId}`, payload),

  /** DELETE /api/me/mentor-services/{serviceId} — Xóa dịch vụ */
  delete: (serviceId: string) => 
    http.del<MentorServiceItem>(`/api/me/mentor-services/${serviceId}`),

  /** PATCH /api/me/mentor-services/{serviceId}/active — Bật/tắt trạng thái hiển thị của dịch vụ */
  toggleActive: (serviceId: string, active: boolean) =>
    http.patch<MentorServiceItem>(`/api/me/mentor-services/${serviceId}/active`, { active }),
};
