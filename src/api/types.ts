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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
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

export type MentorStatus = 'DRAFT' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'SUSPENDED';
export type VerificationDocumentTypeV2 = 'FPTU_AFFILIATION_PROOF' | 'EXPERTISE_PROOF';
export type AllowedActions = { canUploadDocuments: boolean; canSubmit: boolean; canWithdraw: boolean };
export type Checklist = {
  academicProfileCompleted: boolean;
  mentorProfileCompleted: boolean;
  hasAffiliationProof: boolean;
  hasExpertiseProof: boolean;
  canSubmit: boolean;
};

export interface MentorProfileResponse {
  exists: boolean;
  profile?: {
    headline: string;
    expertiseDescription: string;
    supportingSubjects: string | null;
    isAvailable: boolean;
    helpTopicIds: string[];
    teachingMode: TeachingMode;
    sessionDuration: 15 | 30 | 60 | 90;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    status?: MentorStatus;
    requiredFieldsCompleted?: boolean;
  };
}

export interface MentorProfileUpdatePayload {
  headline: string;
  expertiseDescription: string;
  supportingSubjects?: string | null;
  isAvailable: boolean;
  helpTopicIds: string[];
  teachingMode: TeachingMode;
  sessionDuration: 15 | 30 | 60 | 90;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

// ---------- Mentor verification ----------
export type VerificationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'NEEDS_REVISION'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type VerificationDocumentType = 'FPTU_AFFILIATION_PROOF' | 'EXPERTISE_PROOF' | string;
export type DocumentType = VerificationDocumentType;

export interface VerificationDocument {
  documentId: string;
  documentType: VerificationDocumentType;
  isPrimary: boolean;
  fileName: string;
  mime?: string;
  sizeKb?: number;
  uploadedAt?: string;
  url?: string;
  note?: string;
}

export interface TimelineEvent {
  event: string;
  label?: string;
  at: string;
  by?: string;
  note?: string;
}

export interface VerificationChecklistItem {
  key: string;
  label: string;
  passed?: boolean;
  note?: string;
}

export interface MentorProfileSnapshot {
  headline?: string;
  currentPosition?: string;
  currentCompany?: string;
  bio?: string;
  yearsOfExperience?: number;
  expertiseSummary?: string;
  mentoringStyle?: string;
  targetMentees?: string;
}

export interface StudentProfileSnapshot {
  studentCode?: string;
  displayName?: string;
  campusId?: string;
  programId?: string;
  specializationId?: string;
  semester?: number;
  intakeYear?: number;
  isAlumni?: boolean;
  graduationYear?: number | null;
  bio?: string;
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
  checklist?: VerificationChecklistItem[];
  mentorProfile?: MentorProfileSnapshot;
  studentProfile?: StudentProfileSnapshot;
}

export interface MentorVerificationAllowedActions {
  canUploadDocuments: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
}

export interface MentorVerificationChecklist {
  academicProfileCompleted: boolean;
  mentorProfileCompleted: boolean;
  hasAffiliationProof: boolean;
  hasExpertiseProof: boolean;
  canSubmit: boolean;
}

export interface MentorVerificationDocument {
  documentId: string;
  documentType: VerificationDocumentType;
  fileName: string;
  fileUrl: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  reviewNote?: string | null;
  rejectedReason?: string | null;
  isActive?: boolean;
}

export interface MentorVerificationRequestResponse {
  requestId: string;
  status: VerificationStatus;
  documents: MentorVerificationDocument[];
  timeline: TimelineEvent[];
  checklist: MentorVerificationChecklist;
  allowedActions: MentorVerificationAllowedActions;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  submitNote?: string | null;
}

export interface AdminMentorVerificationQueueItemResponse {
  requestId: string;
  mentorUserId: string;
  mentorEmail: string;
  mentorFullName: string;
  mentorAvatarUrl: string | null;
  status: VerificationStatus;
  revisionCount: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMentorVerificationRequestResponse {
  requestId: string;
  mentorUserId: string;
  mentorEmail: string;
  mentorFullName: string;
  mentorAvatarUrl: string | null;
  status: VerificationStatus;
  submitNote: string | null;
  reviewNote: string | null;
  rejectionReason: string | null;
  revisionCount: number;
  reviewerEmail: string | null;
  lockedByAdminEmail: string | null;
  lockedAt: string | null;
  lockExpiresAt: string | null;
  canReview: boolean;
  submittedAt: string | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: any[];
  timeline: any[];
  checklist: any;
  mentorProfile: any | null;
  studentProfile: any | null;
}

export interface AdminMentorVerificationQueueParams {
  page?: number;
  size?: number;
  status?: VerificationStatus;
  keyword?: string;
  submittedFrom?: string;
  submittedTo?: string;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
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
