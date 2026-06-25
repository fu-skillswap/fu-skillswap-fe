// =====================================================================
// src/api/availability.ts — Mentor gán service vào slot có sẵn.
// Mô hình mới: mentor KHÔNG tự tạo khung giờ; slot do hệ thống sinh sẵn,
// mentor chỉ chọn service nào được mở trên từng slot.
// BE: PUT /api/me/availability-slots/{slotId}/services
// Danh sách slot lấy qua mentorsApi.getAvailabilitySlots(myUserId).
// =====================================================================
import { http } from './http';
import type { ManagedAvailabilitySlot } from './types';

export const availabilityApi = {
  /** PUT /api/me/availability-slots/{slotId}/services — thay toàn bộ service gắn vào slot. */
  replaceSlotServices: (slotId: string, serviceIds: string[]) =>
    http.put<ManagedAvailabilitySlot>(`/api/me/availability-slots/${slotId}/services`, { serviceIds }),
};
