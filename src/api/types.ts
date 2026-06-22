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
/**
 * GET /api/me/student-profile — khớp StudentProfileResponse: campus/program/
 * specialization là OBJECT lồng (không phải *Id phẳng).
 */
export interface StudentProfile {
  userId?: string;
  email?: string;
  studentCode: string;
  displayName: string;
  avatarUrl?: string;
  campus?: Campus;
  program?: AcademicProgram;
  specialization?: Specialization;
  semester: number;
  intakeYear: number;
  graduationYear?: number | null;
  bio?: string;
  alumni?: boolean;
}

/** PUT /api/me/student-profile — khớp StudentProfileRequest: dùng *Id phẳng. */
export interface StudentProfilePayload {
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

// ---------- Mentor profile (flat endpoint GET/PUT /api/me/mentor-profile) ----------
export type TeachingMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type SessionDuration = 15 | 30 | 60 | 90;

/** Khớp HelpTopicResponse của BE (nameVi/nameEn, không phải `name`). */
export interface HelpTopic {
  id: string;
  code?: string;
  nameVi: string;
  nameEn?: string;
  weight?: number;
}

export interface MentorProfilePayload {
  headline: string; // required, max 200 chars
  expertiseDescription: string; // required, max 1000 chars
  supportingSubjects?: string; // optional, max 1000 chars
  isAvailable: boolean;
  helpTopicIds: string[]; // required, 1-20 items, no duplicates
  teachingMode: TeachingMode;
  sessionDuration: SessionDuration;
  phoneNumber: string; // BẮT BUỘC, pattern ^(0)(3|5|7|8|9)[0-9]{8}$
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

/** GET/PUT /api/me/mentor-profile trả MentorProfileResponse: helpTopics là mảng tag. */
export interface MentorProfileResponse {
  exists?: boolean;
  requiredFieldsCompleted?: boolean;
  headline?: string;
  expertiseDescription?: string;
  supportingSubjects?: string;
  isAvailable?: boolean;
  helpTopics?: MentorTag[];
  teachingMode?: TeachingMode;
  sessionDuration?: SessionDuration;
  phoneNumber?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export type MentorProfile = MentorProfileResponse;

// ---------- Mentor verification ----------
export type VerificationStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'NEEDS_REVISION'
  | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type DocumentType = 'FPTU_AFFILIATION_PROOF' | 'EXPERTISE_PROOF';

/** Khớp MentorVerificationDocumentResponse (BE mới): id, originalFilename, contentType, sizeBytes... */
export interface VerificationDocument {
  id: string;
  documentType: DocumentType;
  status?: string;
  storageKind?: string;
  originalFilename: string;
  contentType?: string;
  sizeBytes?: number;
  fileUrl?: string;
  isActive?: boolean;
  version?: number;
  reviewNote?: string;
  rejectedReason?: string;
  uploadedAt?: string;
}

/** Khớp MentorVerificationTimelineEventResponse của BE. */
export interface TimelineEvent {
  id?: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  actorUserId?: string;
  actorEmail?: string;
  actorFullName?: string;
  note?: string;
  createdAt: string;
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

// ---------- Mentor discovery (4.8) ----------
/** Tag chủ đề/kỹ năng đính kèm mentor — khớp MentorTagResponse. */
export interface MentorTag {
  id: string;
  code?: string;
  nameVi: string;
  nameEn?: string;
  type?: string;
  primary?: boolean;
}

/** Card mentor trong danh sách khám phá — khớp MentorDiscoveryCardResponse. */
export interface MentorCard {
  mentorUserId: string;
  displayName: string;
  avatarUrl: string;
  headline: string;
  expertiseDescription?: string;
  supportingSubjects?: string;
  isAvailable: boolean;
  ratingAverage: number;
  reviewCount: number;
  completedSessions: number;
  teachingMode: TeachingMode;
  verifiedAt?: string;
  campusId?: string;
  campusName?: string;
  programId?: string;
  programName?: string;
  specializationId?: string;
  specializationName?: string;
  helpTopicTags: MentorTag[];
}

/** Phần tử recommendations — khớp MentorRecommendationResponse. */
export interface MentorRecommendation {
  mentor: MentorCard;
  matchScore: number;
  matchReasons: string[];
}

export type MeetingPlatform = 'GOOGLE_MEET' | 'ZOOM' | 'MICROSOFT_TEAMS' | 'DISCORD' | 'OFFLINE' | 'OTHER';

/** Dịch vụ mentor cung cấp — khớp MentorServiceResponse. */
export interface MentorServiceItem {
  serviceId: string;
  mentorUserId?: string;
  title: string;
  description?: string;
  durationMinutes: number;
  free: boolean;
  priceAmount?: number;
  currency?: string;
  active: boolean;
  helpTopics?: MentorTag[];
}

/** Chi tiết mentor — khớp MentorDiscoveryDetailResponse. */
export interface MentorDetail {
  mentorUserId: string;
  displayName: string;
  avatarUrl: string;
  headline: string;
  bio?: string;
  expertiseDescription?: string;
  supportingSubjects?: string;
  isAvailable: boolean;
  bookingSuspendedUntil?: string;
  ratingAverage: number;
  reviewCount: number;
  completedSessions: number;
  teachingMode: TeachingMode;
  defaultSessionDuration?: number;
  verifiedAt?: string;
  campusId?: string;
  campusName?: string;
  programId?: string;
  programName?: string;
  specializationId?: string;
  specializationName?: string;
  semester?: number;
  alumni?: boolean;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  helpTopicTags: MentorTag[];
  services: MentorServiceItem[];
}

/** Đánh giá mentor — khớp MentorReviewResponse. */
export interface MentorReview {
  reviewId: string;
  reviewerUserId?: string;
  reviewerDisplayName: string;
  reviewerAvatarUrl?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

/** Slot trống của mentor — khớp MentorAvailabilitySlotResponse. */
export interface MentorAvailabilitySlot {
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

// ---------- Bookings (4.9 / 4.10) ----------
export type BookingStatus =
  | 'PENDING' | 'ACCEPTED' | 'REJECTED'
  | 'CANCELLED_BY_MENTEE' | 'CANCELLED_BY_MENTOR'
  | 'COMPLETED' | 'NO_SHOW';

/** Khớp BookingResponse của BE. */
export interface Booking {
  bookingId: string;
  sessionId?: string;
  status: BookingStatus;
  mentorUserId: string;
  mentorDisplayName: string;
  mentorAvatarUrl?: string;
  menteeUserId: string;
  menteeDisplayName: string;
  menteeAvatarUrl?: string;
  slotId?: string;
  serviceId?: string;
  serviceTitle?: string;
  learningGoalTitle?: string;
  learningGoalDescription?: string;
  mentorResponseNote?: string;
  rejectReason?: string;
  cancelReason?: string;
  meetingPlatform?: MeetingPlatform;
  meetingLink?: string;
  location?: string;
  requestedStartTime?: string;
  requestedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  mentorNote?: string;
  menteeNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingPayload {
  mentorUserId: string;
  availabilitySlotId: string;
  serviceId: string;
  learningGoalTitle: string;
  learningGoalDescription: string;
}

export interface SubmitFeedbackPayload {
  rating: number;
  satisfactionLevel?: number;
  comment?: string;
  wouldRecommend?: boolean;
  isPublic?: boolean;
}

export interface MyBookingsParams {
  role?: 'MENTOR' | 'MENTEE';
  status?: BookingStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

// ---------- Mentor availability rules (4.7) ----------
export type AvailabilityRuleType = 'OPEN' | 'CLOSED';
export type AvailabilityRepeatType = 'NONE' | 'DAILY' | 'WEEKLY';

export interface AvailabilityRule {
  ruleId: string;
  ruleType: AvailabilityRuleType;
  repeatType: AvailabilityRepeatType;
  daysOfWeek?: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  active: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertAvailabilityRulePayload {
  ruleType: AvailabilityRuleType;
  repeatType: AvailabilityRepeatType;
  daysOfWeek?: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  startTime: string;
  endTime: string;
  note?: string;
}

// ---------- Admin / System users ----------
export interface SystemUser {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
  roles: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export type AdminMentorStatus =
  | 'DRAFT' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'SUSPENDED';

export interface AdminMentorListItem {
  mentorUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  userStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
  mentorStatus: AdminMentorStatus;
  isAvailable: boolean;
  bookingSuspendedUntil?: string | null;
  headline?: string;
  teachingMode?: TeachingMode;
  sessionDuration?: number;
  ratingAverage?: number;
  reviewCount?: number;
  completedSessions?: number;
  rejectedBookings?: number;
  lateCancellationPenaltyPoints?: number;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}
