// =====================================================================
// src/api/mentorProfile.ts — Mentor Profile (route phẳng, theo
// SkillSwap_FE_Mentor_Onboarding_Guideline_NextJS_v2)
// =====================================================================
import { http } from './http';
import type {
  MentorProfile,
  MentorProfilePayload,
  HelpTopic,
  MentorFeaturedProject,
  MentorFeaturedProjectRequest,
  MentorAchievement,
  MentorAchievementRequest,
} from './types';

export const mentorProfileApi = {
  /** GET /api/me/mentor-profile */
  get: () => http.get<MentorProfile>('/api/me/mentor-profile'),

  /** PUT /api/me/mentor-profile — route phẳng duy nhất, không còn /basic, /expertise */
  update: (payload: MentorProfilePayload) =>
    http.put<MentorProfile>('/api/me/mentor-profile', payload),
};

export const mentorProjectsApi = {
  /** GET /api/me/mentor-projects */
  list: () => http.get<MentorFeaturedProject[]>('/api/me/mentor-projects'),

  /** POST /api/me/mentor-projects */
  create: (payload: MentorFeaturedProjectRequest) =>
    http.post<MentorFeaturedProject>('/api/me/mentor-projects', payload),

  /** PUT /api/me/mentor-projects/{projectId} */
  update: (projectId: string, payload: MentorFeaturedProjectRequest) =>
    http.put<MentorFeaturedProject>(`/api/me/mentor-projects/${projectId}`, payload),

  /** DELETE /api/me/mentor-projects/{projectId} */
  delete: (projectId: string) =>
    http.del<void>(`/api/me/mentor-projects/${projectId}`),

  /** PUT /api/me/mentor-projects/{projectId}/picture */
  uploadPicture: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.put<MentorFeaturedProject>(`/api/me/mentor-projects/${projectId}/picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const mentorAchievementsApi = {
  /** GET /api/me/mentor-achievements */
  list: () => http.get<MentorAchievement[]>('/api/me/mentor-achievements'),

  /** POST /api/me/mentor-achievements */
  create: (payload: MentorAchievementRequest) =>
    http.post<MentorAchievement>('/api/me/mentor-achievements', payload),

  /** PUT /api/me/mentor-achievements/{achievementId} */
  update: (achievementId: string, payload: MentorAchievementRequest) =>
    http.put<MentorAchievement>(`/api/me/mentor-achievements/${achievementId}`, payload),

  /** DELETE /api/me/mentor-achievements/{achievementId} */
  delete: (achievementId: string) =>
    http.del<void>(`/api/me/mentor-achievements/${achievementId}`),
};

export const helpTopicApi = {
  /** GET /api/catalog/help-topics — public endpoint, dùng để load options cho helpTopicIds */
  list: () => http.get<HelpTopic[]>('/api/catalog/help-topics'),
};

