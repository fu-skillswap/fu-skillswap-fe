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
  matchScore?: number;
  matchReasons?: string[];
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
  expectedOutcome?: string;
  durationMinutes: number;
  free: boolean;
  /** Giá dịch vụ theo SCoin (BE mới). 0 nghĩa là miễn phí. */
  priceScoin?: number;
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
  /** Cờ BE mới: mentee có thể gửi yêu cầu đặt lịch cho mentor này không. */
  canRequestBooking?: boolean;
  /** Mentor đã hoàn thiện đầy đủ hồ sơ chưa. */
  hasCompletedProfile?: boolean;
  /** Mentor có ít nhất 1 service đang active không. */
  hasActiveServices?: boolean;
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

/** Service cơ bản gắn vào 1 slot — khớp AvailabilitySlotServiceBasicResponse. */
export interface AvailabilitySlotServiceBasic {
  serviceId: string;
  title: string;
  durationMinutes: number;
  isFree: boolean;
  /** Giá dịch vụ theo SCoin (BE mới). 0 nghĩa là miễn phí. */
  priceScoin?: number;
}

/**
 * Parent availability slot hiển thị cho mentee — khớp MentorAvailabilitySlotResponse (BE mới).
 * Khả năng đặt thực sự được quyết định ở candidate segment (xem getSlotCandidates).
 */
export interface MentorAvailabilitySlot {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  durationMinutes: number;
  teachingMode: TeachingMode;
  pendingRequestCount?: number;
  maxPendingRequests?: number;
  remainingRequestSlots?: number;
  services?: AvailabilitySlotServiceBasic[];
  note?: string;
}

/** 1 candidate segment cụ thể trong slot — khớp ServiceSlotCandidateItemResponse. */
export interface ServiceSlotCandidate {
  startTime: string;
  endTime: string;
  reasonIfBlocked?: string;
}

/** Khớp ServiceSlotCandidatesResponse — danh sách khung giờ đặt được cho 1 service trong 1 slot. */
export interface ServiceSlotCandidates {
  slotId: string;
  serviceId: string;
  serviceDurationMinutes?: number;
  candidateServiceSlots: ServiceSlotCandidate[];
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
}

// ---------- Bookings (luồng mới: candidates + lifecycle 2 phía) ----------
export type BookingStatus =
  | 'PENDING' | 'ACCEPTED' | 'ACCEPTED_AWAITING_PAYMENT' | 'PAID' | 'PAYMENT_EXPIRED'
  | 'REJECTED' | 'EXPIRED'
  | 'CANCELLED_BY_MENTEE' | 'CANCELLED_BY_MENTOR'
  | 'AWAITING_MENTOR_COMPLETION' | 'AWAITING_MENTEE_CONFIRMATION'
  | 'COMPLETED' | 'AUTO_CLOSED' | 'UNDER_REVIEW' | 'NO_SHOW';

/** Loại sự cố mentee/mentor báo sau buổi học — khớp BookingIssueType. */
export type BookingIssueType = 'NO_SHOW_OR_QUALITY_OR_OTHER';

/** Khớp BookingResponse của BE (luồng mới). */
export interface Booking {
  bookingId: string;
  sessionId?: string;
  sessionStatus?: BookingStatus;
  status: BookingStatus;
  mentorUserId: string;
  mentorDisplayName: string;
  mentorAvatarUrl?: string;
  menteeUserId: string;
  menteeDisplayName: string;
  menteeAvatarUrl?: string;
  availabilitySlotId?: string;
  serviceId?: string;
  serviceTitle?: string;
  serviceDescriptionSnapshot?: string;
  serviceExpectedOutcomeSnapshot?: string;
  serviceDurationSnapshot?: number;
  serviceIsFreeSnapshot?: boolean;
  /** Snapshot giá dịch vụ theo SCoin (BE mới). */
  servicePriceScoinSnapshot?: number;
  learningGoalTitle?: string;
  learningGoalDescription?: string;
  mentorResponseNote?: string;
  rejectReason?: string;
  cancelReason?: string;
  meetingPlatform?: MeetingPlatform;
  meetingLink?: string;
  location?: string;
  // Khung giờ mentee đã chọn (thay cho requestedStartTime/EndTime cũ).
  selectedStartTime?: string;
  selectedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  finalizedAt?: string;
  autoClosedAt?: string;
  issueSubmittedAt?: string;
  issueDescription?: string;
  mentorNote?: string;
  menteeNote?: string;
  createdAt?: string;
  updatedAt?: string;
  canCancel?: boolean;
  canComplete?: boolean;
  canReschedule?: boolean;
  canSubmitFeedback?: boolean;
  conversationId?: string;
}

/** POST /api/bookings — payload mới: bỏ mentorUserId, thêm khung giờ đã chọn. */
export interface CreateBookingPayload {
  mentorUserId?: string;
  availabilitySlotId: string;
  serviceId: string;
  selectedStartTime: string;
  selectedEndTime: string;
  learningGoalTitle: string;
  learningGoalDescription?: string;
}

export interface SubmitFeedbackPayload {
  rating: number;
  satisfactionLevel?: number;
  comment?: string;
  wouldRecommend?: boolean;
  isPublic?: boolean;
}

/** POST /api/me/bookings/{id}/issue — mentee báo sự cố sau buổi học. */
export interface SubmitBookingIssuePayload {
  issueType: BookingIssueType;
  description: string;
  wantsAdminReview: boolean;
}

/** Khớp BookingIssueResponse. */
export interface BookingIssueResult {
  bookingId: string;
  status: BookingStatus;
  issueSubmittedAt?: string;
}

/** Payload tạo yêu cầu đổi lịch (reschedule) */
export interface CreateBookingRescheduleRequest {
  proposedSlotId: string;
  proposedSelectedStartTime: string;
  proposedSelectedEndTime: string;
  reason: string;
}

/** Payload phản hồi (chấp nhận/từ chối) đổi lịch */
export interface RespondBookingRescheduleRequest {
  reason: string;
}

/** Thông tin một reschedule request của booking */
export interface BookingRescheduleRequestResponse {
  rescheduleRequestId: string;
  bookingId: string;
  currentSlotId: string;
  proposedSlotId: string;
  previousSelectedStartTime: string;
  previousSelectedEndTime: string;
  proposedSelectedStartTime: string;
  proposedSelectedEndTime: string;
  requesterRole: string;
  requestedByUserId?: string;
  responderRole?: string;
  respondedByUserId?: string;
  status: string; // e.g. PENDING, ACCEPTED, REJECTED, EXPIRED
  requestReason: string;
  responseNote?: string;
  adminOverride?: boolean;
  requestedAt?: string;
  respondedAt?: string;
  expiredAt?: string;
}

export interface MyBookingsParams {
  role?: 'MENTOR' | 'MENTEE';
  status?: BookingStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

// ---------- Mentor availability (slot-service model) ----------
// Mentor không tự tạo khung giờ; slot do hệ thống sinh sẵn, mentor chỉ gán service.
/** Khớp MentorManagedAvailabilitySlotResponse — kết quả sau khi gán service vào slot. */
export interface ManagedAvailabilitySlot {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  active: boolean;
  services?: AvailabilitySlotServiceBasic[];
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

// ---------- Notifications ----------
export type NotificationType =
  | 'MENTOR_VERIFICATION_APPROVED' | 'MENTOR_VERIFICATION_REJECTED' | 'MENTOR_VERIFICATION_NEEDS_REVISION'
  | 'BOOKING_REQUEST_CREATED' | 'BOOKING_ACCEPTED' | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED_BY_MENTEE' | 'BOOKING_CANCELLED_BY_MENTOR' | 'BOOKING_AUTO_REJECTED'
  | 'MEETING_LINK_UPDATED' | 'SESSION_COMPLETED' | 'FEEDBACK_RECEIVED'
  | 'BOOKING_RESCHEDULE_REQUESTED' | 'BOOKING_RESCHEDULE_ACCEPTED'
  | 'BOOKING_RESCHEDULE_REJECTED' | 'BOOKING_RESCHEDULE_EXPIRED'
  | 'BOOKING_REQUEST_EXPIRED' | 'ACCOUNT_UNLOCKED'
  | 'FORUM_POST_COMMENTED' | 'FORUM_POST_HIDDEN' | 'FORUM_COMMENT_HIDDEN'
  | string;

/** Khớp NotificationResponse của BE. */
export interface NotificationItem {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  /** BE trả sẵn đường dẫn điều hướng (ưu tiên dùng thay cho suy luận ở FE). */
  deepLink?: string;
  /** Loại hành động FE nên hiển thị/thực hiện, vd VIEW_BOOKING. */
  actionType?: string;
  read: boolean;
  readAt?: string;
  createdAt?: string;
}

// ---------- Chat / Conversations ----------
// Conversation được BE tạo TỰ ĐỘNG sau khi booking được accept — FE không tạo thủ công.
export type ConversationSourceType = 'BOOKING' | 'DIRECT' | string;
export type ConversationType = 'DIRECT' | 'GROUP' | string;
export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED' | string;
export type MessageType = 'TEXT' | 'SYSTEM' | string;

/** Khớp ConversationResponse của BE — 1 phần tử trong inbox. */
export interface Conversation {
  id: string;
  sourceType?: ConversationSourceType;
  sourceId?: string;
  type?: ConversationType;
  status?: ConversationStatus;
  /** Đối phương (từ góc nhìn user hiện tại). */
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatarUrl?: string;
  lastMessageContent?: string;
  lastMessageAt?: string;
  /** Số tin chưa đọc của user hiện tại trong hội thoại này (BE mới). */
  unreadCount?: number;
  createdAt?: string;
}

/**
 * Payload realtime trong envelope CHAT_MESSAGE_CREATED của raw WebSocket — khớp ChatMessageEvent của BE.
 * Lưu ý: KHÔNG có `isMine`; FE tự suy ra bằng cách so senderId với user hiện tại.
 */
export interface ChatMessageEvent {
  conversationId: string;
  messageId: string;
  senderId?: string;
  senderName?: string;
  messageType: MessageType;
  content: string;
  createdAt?: string;
}

/**
 * Payload realtime khi trạng thái booking thay đổi — khớp BookingStatusUpdatedEvent
 * (BE đẩy qua WS type BOOKING_STATUS_UPDATED cho cả mentee và mentor).
 */
export interface BookingStatusEvent {
  bookingId: string;
  menteeUserId?: string;
  mentorUserId?: string;
  status: BookingStatus;
  message?: string;
  updatedAt?: string;
}

/** Khớp MessageResponse của BE. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  senderName?: string;
  messageType: MessageType;
  content: string;
  createdAt?: string;
  /** True nếu tin nhắn do user hiện tại gửi. */
  isMine: boolean;
}

// =====================================================================
// Payment / Wallet / Payout (module payment BE mới — PayOS, SCoin)
// =====================================================================

/** Trạng thái payment order — khớp PaymentOrderStatus của BE. */
export type PaymentOrderStatus =
  | 'PENDING'
  | 'PARTIALLY_COVERED_BY_CREDIT'
  | 'AWAITING_PROVIDER_PAYMENT'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentProvider = 'PAYOS';

/** Kết quả checkout / trạng thái payment order — khớp PaymentCheckoutResponse của BE. */
export interface PaymentCheckout {
  paymentOrderId: string;
  orderCode: string;
  bookingId: string;
  attemptNo?: number;
  /** Giá gốc dịch vụ (SCoin). */
  basePriceScoin?: number;
  couponDiscountScoin?: number;
  campaignCreditAppliedScoin?: number;
  userCreditAppliedScoin?: number;
  /** Số SCoin còn phải trả qua cổng thanh toán. */
  remainingPayableScoin?: number;
  /** Số tiền VND tương ứng còn phải trả qua PayOS. */
  remainingPayableVnd?: number;
  status: PaymentOrderStatus;
  paymentProvider?: PaymentProvider;
  providerOrderCode?: string;
  providerPaymentLinkId?: string;
  providerStatus?: string;
  /** URL PayOS để redirect người dùng sang thanh toán. */
  checkoutUrl?: string;
  paymentLink?: string;
  expiresAt?: string;
}

/** Trạng thái payout request — khớp PayoutRequestStatus của BE. */
export type PayoutRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

/** Payout profile (tài khoản nhận tiền) của mentor — khớp MentorPayoutProfileResponse. */
export interface MentorPayoutProfile {
  payoutProfileId: string;
  mentorUserId?: string;
  accountHolderName: string;
  bankCode?: string;
  bankName: string;
  accountNumberMasked?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload tạo/cập nhật payout profile — khớp MentorPayoutProfileUpsertRequest. */
export interface MentorPayoutProfilePayload {
  accountHolderName: string;
  bankCode?: string;
  bankName: string;
  accountNumber: string;
  isDefault?: boolean;
  isActive?: boolean;
}

/** Payout request của mentor — khớp PayoutRequestResponse. */
export interface PayoutRequest {
  payoutRequestId: string;
  mentorUserId?: string;
  settlementAccountId?: string;
  payoutProfileId?: string;
  amountScoin: number;
  status: PayoutRequestStatus;
  bankAccountNameSnapshot?: string;
  bankNameSnapshot?: string;
  bankAccountNumberMaskedSnapshot?: string;
  adminUserId?: string;
  adminNote?: string;
  requestedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
}

/** Payload tạo payout request — khớp PayoutRequestCreateRequest. */
export interface PayoutRequestPayload {
  amountScoin: number;
  payoutProfileId?: string;
  note?: string;
}

// =====================================================================
// Wallet (ví Scoin mentee + settlement earnings mentor) — endpoint BE mới
// =====================================================================

/** Loại bút toán sổ cái — khớp LedgerEntryType của BE. */
export type LedgerEntryType =
  | 'ISSUE' | 'RESERVE' | 'CONSUME' | 'RELEASE' | 'REFUND'
  | 'ADJUSTMENT' | 'HOLD' | 'PAID_OUT' | 'COMMISSION' | 'VOID';

/** Nguồn phát sinh giao dịch — khớp LedgerSourceType của BE. */
export type LedgerSourceType =
  | 'PAYMENT_ORDER' | 'BOOKING' | 'CAMPAIGN' | 'COUPON' | 'MANUAL' | 'PAYOUT_REQUEST' | 'REFUND';

/** Một giao dịch ví — khớp WalletTransactionResponse. */
export interface WalletTransaction {
  id: string;
  entryType: LedgerEntryType;
  originType?: CreditOriginType;
  sourceType?: LedgerSourceType;
  sourceId?: string;
  amountScoin: number;
  /** Ảnh hưởng số dư, có dấu: > 0 cộng vào ví, < 0 trừ ra. */
  balanceEffectScoin: number;
  memo?: string;
  createdAt?: string;
}

/** Nguồn gốc credit của mentee — khớp CreditOriginType của BE. */
export type CreditOriginType =
  | 'CAMPAIGN_BONUS' | 'COUPON_BONUS' | 'REFUND' | 'MANUAL' | 'PAYMENT_RESERVATION';

/** Ví Scoin của mentee — khớp CreditWalletResponse (GET /api/me/credit-wallet). */
export interface CreditWallet {
  availableScoin: number;
  recentTransactions: WalletTransaction[];
}

/** Ví settlement earnings của mentor — khớp MentorWalletResponse (GET /api/me/mentor-wallet). */
export interface MentorWallet {
  availableScoin: number;
  recentTransactions: WalletTransaction[];
}

// =====================================================================
// Forum (diễn đàn thảo luận) — module BE mới /api/forum
// =====================================================================

export type ForumPostStatus = 'PUBLISHED' | 'HIDDEN';
export type ForumReactionType = 'LIKE';
export type ForumReportTargetType = 'POST' | 'COMMENT';
export type ForumReportReasonType = 'SPAM' | 'OFF_TOPIC' | 'HARASSMENT' | 'MISLEADING' | 'OTHER';

/** Help topic gắn vào post forum — khớp ForumHelpTopicResponse. */
export interface ForumHelpTopicLite {
  id: string;
  code?: string;
  nameVi: string;
  nameEn?: string;
}

/** Bài viết forum — khớp ForumPostResponse. */
export interface ForumPost {
  postId: string;
  authorUserId: string;
  authorFullName: string;
  authorAvatarUrl?: string;
  helpTopic?: ForumHelpTopicLite;
  title: string;
  content: string;
  status: ForumPostStatus;
  commentCount: number;
  reactionCount: number;
  reportCount?: number;
  lastActivityAt?: string;
  reactedByCurrentUser: boolean;
  myReactionType?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Comment forum — khớp ForumCommentResponse. */
export interface ForumComment {
  commentId: string;
  postId: string;
  authorUserId: string;
  authorFullName: string;
  authorAvatarUrl?: string;
  content: string;
  status: ForumPostStatus;
  reportCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload tạo/cập nhật post — khớp ForumPostUpsertRequest. */
export interface ForumPostPayload {
  title: string;
  content: string;
  helpTopicId: string;
}

/** Payload tạo report — khớp ForumReportCreateRequest. */
export interface ForumReportPayload {
  targetType: ForumReportTargetType;
  targetId: string;
  reasonType: ForumReportReasonType;
  description?: string;
}

// =====================================================================
// Lịch rảnh mentor (availability rules) — /api/me/availability-rules
// Mentor tạo rule rảnh theo tuần -> BE sinh slot -> gán service vào slot.
// =====================================================================
export type AvailabilityRuleType = 'OPEN' | 'CLOSED' | 'BUSY';
export type AvailabilityRepeatType = 'NONE' | 'DAILY' | 'WEEKLY';
export type DayOfWeekCode = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | string;

/** Rule lịch rảnh — khớp AvailabilityRuleResponse. */
export interface AvailabilityRule {
  ruleId: string;
  ruleType: AvailabilityRuleType;
  repeatType: AvailabilityRepeatType;
  daysOfWeek?: DayOfWeekCode[];
  /** YYYY-MM-DD */
  effectiveFrom: string;
  effectiveTo?: string;
  /** HH:mm */
  startTime?: string;
  endTime?: string;
  timezone?: string;
  active?: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload tạo/cập nhật rule — khớp UpsertAvailabilityRuleRequest. */
export interface AvailabilityRulePayload {
  ruleType: AvailabilityRuleType;
  repeatType: AvailabilityRepeatType;
  daysOfWeek?: DayOfWeekCode[];
  effectiveFrom: string;
  effectiveTo?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
}
