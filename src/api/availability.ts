// =====================================================================
// src/api/availability.ts — Mentor gán service vào slot có sẵn và Quản lý luật rảnh.
// =====================================================================
import { http } from './http';
import type { ManagedAvailabilitySlot, AvailabilityRule, AvailabilityRulePayload } from './types';

export const availabilityApi = {
  /** PUT /api/me/availability-slots/{slotId}/services — thay toàn bộ service gắn vào slot. */
  replaceSlotServices: (slotId: string, serviceIds: string[]) =>
    http.put<ManagedAvailabilitySlot>(`/api/me/availability-slots/${slotId}/services`, { serviceIds }),

  /** GET /api/me/availability-rules — lấy danh sách luật rảnh */
  listRules: () =>
    http.get<AvailabilityRule[]>('/api/me/availability-rules', { params: { _t: Date.now() } }),

  /** POST /api/me/availability-rules — tạo mới luật rảnh */
  createRule: (payload: AvailabilityRulePayload) =>
    http.post<AvailabilityRule>('/api/me/availability-rules', payload),

  /** DELETE /api/me/availability-rules/{ruleId} — xóa luật rảnh */
  deleteRule: (ruleId: string) =>
    http.del<void>(`/api/me/availability-rules/${ruleId}`),
};
