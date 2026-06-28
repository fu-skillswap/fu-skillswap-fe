// =====================================================================
// src/api/availability.ts — Mentor gán service vào slot có sẵn và Quản lý luật rảnh.
// =====================================================================
import { http } from './http';
import type { ManagedAvailabilitySlot, AvailabilityRule, AvailabilityRulePayload } from './types';

export const availabilityApi = {
  /** TODO: Nối API PUT /api/me/availability-slots/{slotId}/services để thay đổi danh sách lớp dạy của slot */
  replaceSlotServices: async (slotId: string, serviceIds: string[]): Promise<ManagedAvailabilitySlot> => {
    console.log('Mock PUT /api/me/availability-slots/' + slotId + '/services', { serviceIds });
    return { slotId, startTime: '', endTime: '', active: true, services: [] };
  },

  /** POST /api/me/availability-slots — Tạo mới slot rảnh lớn */
  createSlot: (payload: { startTime: string; endTime: string; note?: string; serviceIds: string[] }) =>
    http.post<ManagedAvailabilitySlot>('/api/me/availability-slots', payload),

  /** TODO: Nối API PUT /api/me/availability-slots/{slotId} để cập nhật slot rảnh */
  updateSlot: async (slotId: string, payload: { startTime: string; endTime: string; note?: string; serviceIds: string[] }): Promise<ManagedAvailabilitySlot> => {
    console.log('Mock PUT /api/me/availability-slots/' + slotId, payload);
    return { slotId, startTime: payload.startTime, endTime: payload.endTime, active: true, note: payload.note, services: [] };
  },

  /** TODO: Nối API DELETE /api/me/availability-slots/{slotId} để xóa/hủy slot rảnh của mentor */
  deleteSlot: async (slotId: string): Promise<void> => {
    console.log('Mock DELETE /api/me/availability-slots/' + slotId);
  },

  /** GET /api/me/availability-rules — lấy danh sách luật rảnh */
  listRules: () =>
    http.get<AvailabilityRule[]>('/api/me/availability-rules', { params: { _t: Date.now() } }),

  /** POST /api/me/availability-rules — tạo mới luật rảnh */
  createRule: (payload: AvailabilityRulePayload) =>
    http.post<AvailabilityRule>('/api/me/availability-rules', payload),

  /** DELETE /api/me/availability-rules/{ruleId} — xóa luật rảnh */
  deleteRule: (ruleId: string) =>
    http.del<void>(`/api/me/availability-rules/${ruleId}`),

  /** PUT /api/me/availability-rules/{ruleId} — cập nhật luật rảnh */
  updateRule: (ruleId: string, payload: AvailabilityRulePayload) =>
    http.put<AvailabilityRule>(`/api/me/availability-rules/${ruleId}`, payload),
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
