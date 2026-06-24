// =====================================================================
// src/api/availability.ts — Mentor availability rules (4.7)
// =====================================================================
import { http } from './http';
import type { AvailabilityRule, UpsertAvailabilityRulePayload } from './types';

export const availabilityApi = {
  /** GET /api/mentor/availability-rules */
  list: () => http.get<AvailabilityRule[]>('/api/mentor/availability-rules', { params: { _t: Date.now() } }),

  /** POST /api/mentor/availability-rules */
  create: (payload: UpsertAvailabilityRulePayload) =>
    http.post<AvailabilityRule>('/api/mentor/availability-rules', payload),

  /** PUT /api/mentor/availability-rules/{ruleId} */
  update: (ruleId: string, payload: UpsertAvailabilityRulePayload) =>
    http.put<AvailabilityRule>(`/api/mentor/availability-rules/${ruleId}`, payload),

  /** DELETE /api/mentor/availability-rules/{ruleId} */
  remove: (ruleId: string) =>
    http.del<void>(`/api/mentor/availability-rules/${ruleId}`),
};
