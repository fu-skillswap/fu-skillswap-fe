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

// ---------- Mentor profile (flat endpoint GET/PUT /api/me/mentor-profile) ----------
export type TeachingMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type SessionDuration = 15 | 30 | 60 | 90;

export interface HelpTopic {
  id: string;
  code?: string;
  name: string;
}

export interface MentorProfilePayload {
  headline: string; // required, max 200 chars
  expertiseDescription: string; // required, max 1000 chars
  supportingSubjects?: string; // optional, max 1000 chars
  isAvailable: boolean;
  helpTopicIds: string[]; // required, 1-20 items, no duplicates
  teachingMode: TeachingMode;
  sessionDuration: SessionDuration;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export type MentorProfile = MentorProfilePayload;

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

/** Trạng thái hoàn thiện hồ sơ — BE trả về để FE render checklist, không tự suy luận. */
export interface VerificationChecklist {
  academicProfileCompleted: boolean;
  mentorProfileCompleted: boolean;
  hasAffiliationProof: boolean;
  hasExpertiseProof: boolean;
  canSubmit: boolean;
}

/** Hành động nào FE được phép cho phép user thực hiện — BE quyết định, FE chỉ render theo. */
export interface VerificationAllowedActions {
  canUploadDocuments: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
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
  checklist?: VerificationChecklist;
  allowedActions?: VerificationAllowedActions;
}

// ---------- Mentor discovery ----------
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
