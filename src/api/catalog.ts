// =====================================================================
// src/api/catalog.ts — Academic Catalog (4.3)
// =====================================================================
import { http } from './http';
import type { Campus, AcademicProgram, Specialization } from './types';

export const catalogApi = {
  /** GET /api/campuses */
  getCampuses: () => http.get<Campus[]>('/api/campuses'),

  /** GET /api/academic-programs */
  getPrograms: () => http.get<AcademicProgram[]>('/api/academic-programs'),

  /** GET /api/specializations — toàn bộ chuyên ngành */
  getSpecializations: () => http.get<Specialization[]>('/api/specializations'),

  /** GET /api/academic-programs/{programId}/specializations */
  getSpecializationsByProgram: (programId: string) =>
    http.get<Specialization[]>(`/api/academic-programs/${programId}/specializations`),
};
