// =====================================================================
// src/api/types.ts
// DTO + ApiResponse cho SkillSwap, bám theo tài liệu API backend.
// =====================================================================

/** Bao response chung của backend: { timestamp, status, code, message, data } */
export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  data: T;
}

export interface Paged<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ---------- Auth ----------
export type Role = 'MENTEE' | 'MENTOR' | 'ADMIN' | 'SYSTEM_ADMIN';

// refreshToken nằm trong HttpOnly Cookie (skillswap_refresh_token) do BE set,
// FE không đọc/lưu refreshToken nên không khai báo field này ở đây.
export interface AuthTokens {
  accessToken: string;
  tokenType?: string;
}

export interface MeResponse {
  publicId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  status: string;
  roles: Role[];
  profileCompleted: boolean;
  hasStudentProfile: boolean;
}

// ---------- Academic catalog ----------
export interface Campus { id: string; code: string; name: string; city?: string; }
export interface AcademicProgram { id: string; code: string; nameVi: string; nameEn?: string; }
export interface Specialization { id: string; programId: string; code: string; nameVi: string; nameEn?: string; }

// ---------- Student profile ----------
export interface StudentProfile {
  studentCode: string;
  displayName: string;
  avatarUrl?: string;
  campusId: string;
  programId: string;
  specializationId: string;
  semester: number;
  intakeYear: number;
  isAlumni: boolean;
  graduationYear?: number | null;
  bio?: string;
}
export type StudentProfilePayload = StudentProfile;

// ---------- Mentor profile ----------
export interface MentorBasicPayload {
  headline: string;
  currentPosition?: string;
  currentCompany?: string;
  avatarUrl?: string;
  bio?: string;
  isAvailable: boolean;
}
export interface MentorExpertisePayload {
  expertiseTagIds: string[];
  helpTopicIds: string[];
  yearsOfExperience: number;
  industry?: string;
  expertiseSummary?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}
export interface MentorProfile extends MentorBasicPayload, MentorExpertisePayload {}

// ---------- Mentor verification ----------
export type VerificationStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'NEEDS_REVISION'
  | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type DocumentType = 'FPTU_AFFILIATION_PROOF' | 'EXPERTISE_PROOF';

export interface VerificationDocument {
  documentId: string;
  documentType: DocumentType;
  isPrimary: boolean;
  fileName: string;
  mime?: string;
  sizeKb?: number;
  uploadedAt?: string;
}

export interface TimelineEvent {
  event: string;
  label?: string;
  at: string;
  by?: string;
  note?: string;
}

export interface VerificationRequest {
  requestId: string;
  status: VerificationStatus;
  submitNote?: string;
  reviewNote?: string;
  createdAt?: string;
  submittedAt?: string | null;
  documents: VerificationDocument[];
  timeline?: TimelineEvent[];
}

// ---------- Mentor discovery ----------
export type TeachingMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';

export interface MentorCardDto {
  mentorUserId: string;
  displayName: string;
  avatarUrl: string;
  headline: string;
  currentPosition?: string;
  currentCompany?: string;
  campus?: string;
  program?: string;
  specialization?: string;
  expertiseTags: string[];
  helpTopics: string[];
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  sessionCount: number;
  isAvailable: boolean;
  teachingMode: TeachingMode;
  matchScore?: number;
  matchingReasons?: string[];
}

export interface MentorService {
  id: string;
  title: string;
  durationMinutes: number;
  mode: TeachingMode;
  description?: string;
}

export interface MentorDetailDto extends MentorCardDto {
  bio: string;
  expertiseSummary: string;
  mentoringStyle?: string;
  targetMentees?: string;
  social: { linkedin?: string; github?: string; portfolio?: string };
  services: MentorService[];
}

export interface AvailabilitySlot {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  durationMinutes: number;
  teachingMode: TeachingMode;
  recurring: boolean;
}

export interface MentorSearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
  keyword?: string;
  tagIds?: string[];
  campusId?: string;
  specializationId?: string;
  teachingMode?: TeachingMode;
  isAvailable?: boolean;
}
