// =====================================================================
// src/api/mentorProfile.ts — Mentor Profile (route phẳng, theo
// SkillSwap_FE_Mentor_Onboarding_Guideline_NextJS_v2)
// =====================================================================
import { http } from './http';
import type { MentorProfile, MentorProfilePayload, HelpTopic } from './types';

export const mentorProfileApi = {
  /** GET /api/me/mentor-profile */
  get: () => http.get<MentorProfile>('/api/me/mentor-profile'),

  /** PUT /api/me/mentor-profile — route phẳng duy nhất, không còn /basic, /expertise */
  update: (payload: MentorProfilePayload) =>
    http.put<MentorProfile>('/api/me/mentor-profile', payload),
};

export const helpTopicApi = {
  /** GET /api/catalog/help-topics — public endpoint, dùng để load options cho helpTopicIds */
  list: () => http.get<HelpTopic[]>('/api/catalog/help-topics'),
};
