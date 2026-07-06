// =====================================================================
// src/api/matching.ts — Mentoring needs questionnaire + onboarding status.
// Contract BE mới: mentee trả lời 5 câu hỏi để hệ thống matching mentor.
// =====================================================================
import { http } from './http';
import type {
  OnboardingStatus,
  MatchingProfile,
  MatchingQuestionnaire,
  MatchingSubmitPayload,
} from './types';

export const onboardingApi = {
  /** GET /api/me/onboarding-status — gồm cờ mới `mentoringNeedsCompleted`. */
  getStatus: () => http.get<OnboardingStatus>('/api/me/onboarding-status'),
};

export const matchingApi = {
  /** GET /api/me/matching-profile — trạng thái nhu cầu mentoring của user. */
  getProfile: () => http.get<MatchingProfile>('/api/me/matching-profile'),

  /** GET /api/me/matching-profile/questionnaire — bộ 5 câu hỏi đang active. */
  getQuestionnaire: () => http.get<MatchingQuestionnaire>('/api/me/matching-profile/questionnaire'),

  /** PUT /api/me/matching-profile — lưu 5 câu trả lời. */
  submit: (payload: MatchingSubmitPayload) =>
    http.put<MatchingProfile>('/api/me/matching-profile', payload),
};
