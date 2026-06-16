// =====================================================================
// src/api/mentorProfile.ts — Mentor Profile onboarding (4.5)
// =====================================================================
import { http } from './http';
import type { MentorProfile, MentorBasicPayload, MentorExpertisePayload } from './types';

export const mentorProfileApi = {
  /** GET /api/me/mentor-profile */
  get: () => http.get<MentorProfile>('/api/me/mentor-profile'),

  /** PUT /api/me/mentor-profile/basic — Step 1 onboarding */
  updateBasic: (payload: MentorBasicPayload) =>
    http.put<MentorProfile>('/api/me/mentor-profile/basic', payload),

  /** PUT /api/me/mentor-profile/expertise — Step 2 onboarding */
  updateExpertise: (payload: MentorExpertisePayload) =>
    http.put<MentorProfile>('/api/me/mentor-profile/expertise', payload),
};
