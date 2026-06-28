// =====================================================================
// src/api/availability.ts — Lịch rảnh mentor.
// 2 phần: (1) tạo rule rảnh theo tuần -> BE sinh slot; (2) gán service
// vào từng slot đã sinh. Danh sách slot lấy qua mentorsApi.getAvailabilitySlots.
// =====================================================================
import { http } from './http';
import type { ManagedAvailabilitySlot, AvailabilityRule, AvailabilityRulePayload } from './types';

export const availabilityApi = {
  /** PUT /api/me/availability-slots/{slotId}/services — thay toàn bộ service gắn vào slot. */
  replaceSlotServices: (slotId: string, serviceIds: string[]) =>
    http.put<ManagedAvailabilitySlot>(`/api/me/availability-slots/${slotId}/services`, { serviceIds }),
};

export const availabilityRulesApi = {
  /** GET /api/me/availability-rules — danh sách rule lịch rảnh của mentor. */
  list: () => http.get<AvailabilityRule[]>('/api/me/availability-rules'),

  /** POST /api/me/availability-rules — tạo rule (BE tự sinh slot từ rule). */
  create: (payload: AvailabilityRulePayload) =>
    http.post<AvailabilityRule>('/api/me/availability-rules', payload),

  /** PUT /api/me/availability-rules/{ruleId} — cập nhật rule. */
  update: (ruleId: string, payload: AvailabilityRulePayload) =>
    http.put<AvailabilityRule>(`/api/me/availability-rules/${ruleId}`, payload),

  /** DELETE /api/me/availability-rules/{ruleId} — xoá rule. */
  remove: (ruleId: string) => http.del<void>(`/api/me/availability-rules/${ruleId}`),
};
