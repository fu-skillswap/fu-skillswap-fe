// =====================================================================
// src/lib/api/adminMentorVerificationApi.ts — Admin Mentor Verification (4.7)
// =====================================================================
import { apiClient } from '@/api/client';
import type { Paged } from '@/api/types';
import type { AxiosRequestConfig } from 'axios';

async function authFetchWithRefresh<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  // BE bọc mọi response trong ApiResponse { data: ... }. Phải unwrap `.data.data`,
  // nếu không `result.content`/`result.status`... = undefined (trang admin bị trống).
  const response = await apiClient.request<{ data: T }>({
    url,
    method,
    data: body,
    ...config,
  });
  return response.data.data;
}

export type AdminVerificationQueueItem = {
  requestId: string;
  mentorUserId: string;
  mentorEmail: string;
  mentorFullName: string;
  mentorAvatarUrl: string | null;
  status: string;
  revisionCount: number;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type VerificationLockStatus = {
  requestId: string;
  canReview: boolean;
  lockedByAdminEmail: string | null;
};

export type AdminVerificationDetail = {
  requestId: string;
  mentorUserId: string;
  mentorEmail: string;
  mentorFullName: string;
  mentorAvatarUrl?: string | null;
  status: string;
  submitNote?: string | null;
  reviewNote?: string | null;
  rejectionReason?: string | null;
  revisionCount: number;
  reviewerEmail?: string | null;
  lockedByAdminEmail?: string | null;
  lockedAt?: string | null;
  lockExpiresAt?: string | null;
  canReview: boolean;
  submittedAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // Khớp MentorVerificationDocumentResponse của BE mới.
  documents: Array<{
    id: string;
    documentType: string;
    status?: string;
    storageKind?: string;
    originalFilename: string;
    contentType?: string;
    sizeBytes?: number;
    fileUrl?: string;
    isActive?: boolean;
    version?: number;
    reviewNote?: string | null;
    rejectedReason?: string | null;
    uploadedAt?: string;
  }>;
  checklist: {
    academicProfileCompleted: boolean;
    mentorProfileCompleted: boolean;
    hasAffiliationProof: boolean;
    hasExpertiseProof: boolean;
    canSubmit: boolean;
  } | null;
  timeline: Array<{
    id?: string;
    event?: string; // fallback
    eventType?: string;
    fromStatus?: string;
    toStatus?: string;
    actorUserId?: string;
    actorEmail?: string;
    actorFullName?: string;
    label?: string;
    at?: string; // fallback
    createdAt?: string;
    by?: string; // fallback
    note?: string | null;
  }>;
  // Khớp StudentProfileResponse: campus/program/specialization là object lồng.
  studentProfile: {
    userId?: string;
    email?: string;
    studentCode: string;
    displayName: string;
    avatarUrl?: string;
    campus?: { id: string; code?: string; name: string; city?: string };
    program?: { id: string; code?: string; nameVi: string; nameEn?: string };
    specialization?: { id: string; programId?: string; code?: string; nameVi: string; nameEn?: string; expected?: boolean; other?: boolean };
    semester: number;
    intakeYear: number;
    alumni?: boolean;
    graduationYear?: number | null;
    bio?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  // Khớp MentorProfileResponse: helpTopics là mảng tag.
  mentorProfile: {
    exists?: boolean;
    requiredFieldsCompleted?: boolean;
    userId?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    mentorStatus?: string;
    headline?: string;
    expertiseDescription?: string;
    supportingSubjects?: string;
    isAvailable?: boolean;
    verifiedAt?: string;
    helpTopics?: Array<{ id: string; code?: string; nameVi: string; nameEn?: string; type?: string; primary?: boolean }>;
    teachingMode?: string;
    sessionDuration?: number;
    phoneNumber?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
};

export async function getVerificationQueue(params: {
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
}): Promise<Paged<AdminVerificationQueueItem>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.direction) query.set('direction', params.direction);
  const queryString = query.toString();
  const url = `/api/admin/mentor-verification/requests${queryString ? `?${queryString}` : ''}`;
  return authFetchWithRefresh<Paged<AdminVerificationQueueItem>>(url, 'GET');
}

export async function getVerificationDetail(requestId: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'GET');
}

export async function getLockStatus(requestId: string): Promise<VerificationLockStatus> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/lock`;
  return authFetchWithRefresh<VerificationLockStatus>(url, 'GET');
}

export async function refreshLock(requestId: string): Promise<VerificationLockStatus> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/lock/refresh`;
  return authFetchWithRefresh<VerificationLockStatus>(url, 'POST');
}

export async function requestRevision(requestId: string, note: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/request-revision`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'POST', { note });
}

export async function approveVerification(requestId: string, note?: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/approve`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'POST', { note });
}

export async function rejectVerification(requestId: string, note: string): Promise<AdminVerificationDetail> {
  const url = `/api/admin/mentor-verification/requests/${requestId}/reject`;
  return authFetchWithRefresh<AdminVerificationDetail>(url, 'POST', { note });
}
