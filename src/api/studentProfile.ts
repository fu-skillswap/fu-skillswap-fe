// =====================================================================
// src/api/studentProfile.ts — Student Profile (4.4)
// =====================================================================
import { http } from './http';
import type { StudentProfile, StudentProfilePayload } from './types';

export const studentProfileApi = {
  /** GET /api/me/student-profile */
  get: () => http.get<StudentProfile>('/api/me/student-profile'),

  /** PUT /api/me/student-profile — tạo hoặc cập nhật */
  upsert: (payload: StudentProfilePayload) =>
    http.put<StudentProfile>('/api/me/student-profile', payload),
};
